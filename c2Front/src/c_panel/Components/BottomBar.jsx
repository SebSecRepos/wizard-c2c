import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import './BottomBar.css'
import { useAuthStore } from '../../hooks';
import { toast, ToastContainer } from 'react-toastify';
import AlertModal from '../../util-components/AlertModal';


/**
 * @param {React.ChangeEvent<HTMLInputElement>} e
 * @param {string} category
 */


export const BottomBar=({ id="", setExternalCmd, externalCmd, sys="" })=> {


    const {startLogOut, user} = useAuthStore()
    
    const [alert, setAlert] = useState(false);
    const [commandToDelete, setCommandToDelete] = useState(undefined);

    const [activeDropdown, setActiveDropdown] = useState(null);
    const [operations, setOperations] = useState([]);
    const [commandToAdd, setCommandToAdd] = useState({
      command:"",
      name:"",
      category:"",
      sys
    });

    const categories = [...new Set(operations.map(op => op.category))];

    const onChangeCommand = (e) => {
      const { id, value } = e.target;

      if (id === "name") {
        setCommandToAdd({
          ...commandToAdd,
          name: value, 
        });
      }

      if (id === "category") {
        setCommandToAdd({
          ...commandToAdd,
          category: value, 
        });
      }

      if (id === "command") {
        setCommandToAdd({
          ...commandToAdd,
          command: value, 
        });
      }
    };



    const download =(file_name, content, type = 'text/plain')=> {
        const blob = new Blob([content], { type: type });
        const url = URL.createObjectURL(blob);

        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = file_name;
        enlace.style.display = 'none';

        document.body.appendChild(enlace);
        enlace.click();

        // Limpieza
        document.body.removeChild(enlace);
        URL.revokeObjectURL(url);
    }


    const getOperationsBySystem=async()=>{
        try {
            const req = await fetch(`${import.meta.env.VITE_API_URL}/api/rcv/operations`,{
              method:"post",
              headers:{
                "Content-Type":"application/json",
                "x-token": Cookies.get('x-token')
              },
              body:JSON.stringify({sys})
            })

            const data = await req.json();


            setOperations(data.operations)
        } catch (error) {
          toast.error(error)
        }
    }


    useEffect(()=>{
      getOperationsBySystem()
    },[])




  const cmd = async (input, type="") => {

    if (type === "external") {
        setExternalCmd(input);
        return;
    }


    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/rcv/cmd/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-token':`${Cookies.get('x-token')}`},
        body: JSON.stringify({ cmd: input })
      });

      if (!response.ok) throw new Error(`Server error ${response.status}`);

      const data = await response.json();

      if (data.msg === "Invalid auth") {
        toast.error("Invalid auth");
        startLogOut();
      }

      if (type==="download" ) {
          download("creds.txt", data.result)
      }

      
    } catch (error) {
      console.error('Error in customCommand:', error);
    }
  };



  const getOperationsByCategory = (category) => operations.filter(op => op.category === category);

  const toggleDropdown = (category) => {
    setActiveDropdown(activeDropdown === category ? null : category);
  };


  const addCommand=async(default_category)=>{
    try {
      const { sys, command, category, name } = commandToAdd;

      let new_command={
        sys,
        command,
        category,
        name
      }

      if( command.length <=0 || name.length <=0  ){
        toast.error("Fields can't be empty");
        return;
      }

      if( sys != "windows" && sys != 'linux'  ){
        toast.error("Invalid operating system");
        return;
      }

      if (category.length <= 0) new_command.category=default_category;
      
      if( !categories.includes(new_command.category) ) toast.info(`New category: ${ category }`);
      
      const req = await fetch(`${import.meta.env.VITE_API_URL}/api/rcv/add_command`,{
        method:'post',
        headers:{
          'Content-Type': 'application/json',
          'x-token': Cookies.get('x-token')
        },
        body: JSON.stringify(new_command)
      })

      const resp = await req.json();
      
      if(resp.ok) {
        toast.success(resp.msg)
        getOperationsBySystem()

      }
        
      if(!resp.ok){
        toast.error(resp.msg);
      }
      
      
    } catch (error) {
      toast.error(error)
    }

    setCommandToAdd({        
        sys,
        command:"",
        category:"",
        name:""
      })

  }


  const set_command_to_delete=(cmd)=>{
    setCommandToDelete(cmd);
    setAlert(true);   
  }


  const delete_command=async()=>{

    try {
          
      const req = await fetch(`${import.meta.env.VITE_API_URL}/api/rcv/delete_command`,{
        method:'delete',
        headers:{
          'Content-Type': 'application/json',
          'x-token': Cookies.get('x-token')
        },
        body: JSON.stringify(commandToDelete)
      })

      const resp = await req.json();
      
      if(resp.ok) {
        toast.success(resp.msg)
        getOperationsBySystem()
      }
        
      if(!resp.ok){
        toast.error(resp.msg);
      }
      
    } catch (error) {
      toast.error(error);
    }

    setCommandToDelete(null);
  }


   return (

    <>
    
      <nav className="BottomBar">


        {
          categories.length <= 0 &&
          <div className="dropdown">
            <button className="dropdown-button-bottom-bar" onClick={() => toggleDropdown('Add')}>
              + Add category
            </button>


            {
            activeDropdown === 'Add' && (
              <div className="dropdown-content floating-box">

                <span className="close" onClick={ () => toggleDropdown(null) }>x</span>

                {user?.role === "admin" &&
                  <div className='top-category-windows'>
                    <div className='add-cmd-input_container'>
                      <label htmlFor="name">Name</label>
                      <input
                        type="text"
                        id="name"
                        value={commandToAdd.name}
                        placeholder='name'
                        onChange={(e) => onChangeCommand(e)}
                      />
                    </div>
                    <div className='add-cmd-input_container'>
                      <label htmlFor="name">Category</label>
                      <input
                        type="text"
                        id="category"
                        value={commandToAdd.category}
                        placeholder={`Current: "new category"`}
                        onChange={(e) => onChangeCommand(e)}
                      />
                    </div>

                    <div className='add-cmd-input_command'>
                      <label htmlFor="command">Command</label>
                      <input
                        type="text"
                        id="command"
                        value={commandToAdd.command}
                        placeholder='command'
                        onChange={(e) => onChangeCommand(e)}
                      />
                    </div>

                    <span className="add-command-btn" onClick={() => addCommand("new category")}>
                      Add command
                    </span>
                  </div>
                  
                }
              </div>
            )}







          </div>  
        }
        {categories.map((category) => (
          <div className="dropdown" key={category}>
            <button className="dropdown-button-bottom-bar" onClick={() => toggleDropdown(category)}>
              {category}
            </button>

            {
            activeDropdown === category && (
              <div className="dropdown-content floating-box">

                <span className="close" onClick={ () => toggleDropdown(null) }>x</span>

                {user?.role === "admin" &&
                  <div className='top-category-windows'>
                    <div className='add-cmd-input_container'>
                      <label htmlFor="name">Name</label>
                      <input
                        type="text"
                        id="name"
                        value={commandToAdd.name}
                        placeholder='name'
                        onChange={(e) => onChangeCommand(e)}
                      />
                    </div>
                    <div className='add-cmd-input_container'>
                      <label htmlFor="name">Category</label>
                      <input
                        type="text"
                        id="category"
                        value={commandToAdd.category}
                        placeholder={`Current "${category}"`}
                        onChange={(e) => onChangeCommand(e)}
                      />
                    </div>

                    <div className='add-cmd-input_command'>
                      <label htmlFor="command">Command</label>
                      <input
                        type="text"
                        id="command"
                        value={commandToAdd.command}
                        placeholder='command'
                        onChange={(e) => onChangeCommand(e)}
                      />
                    </div>

                    <span className="add-command-btn" onClick={() => addCommand(category)}>
                      Add command
                    </span>
                  </div>
                  
                }

                {
                getOperationsByCategory(category).map(({ name, command, category, sys }) => (
                  <div className="dropdown-item" key={name}>
                    <h4>{name}</h4>
                    <pre className="command">
                      <button className="launch-btn" onClick={() =>{
                        toggleDropdown(null);
                        cmd(command, "external");
                      } }>Run</button> 
                      <p className='cmd-pre'>{command}</p>
                       
                    </pre>
                      <button className='delete-cmd-btn' onClick={()=> set_command_to_delete({name,command,category,sys})} >Delete command</button>
                  </div>
                ))
                
                }
              </div>
            )}
          </div>
        ))}

      </nav>

        <ToastContainer
        style={{backgroundColor:"transparent"}}
        position="top-center"
        autoClose={4000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        />    
        <AlertModal
          visible={alert}
          onClose={() => setAlert(false)}
          onConfirm={() => delete_command()}
          title="Warning! Command will be deleted"
          description="Command will be deleted"
          confirmText="Confirm"
          cancelText="Cancel"
  
        />
    </>
  );
}

