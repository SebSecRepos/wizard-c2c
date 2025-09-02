// src/components/Register.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../../hooks';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import AlertModal from '../../util-components/AlertModal';
import { ToastContainer, toast } from "react-toastify";
import './AdminUsers.css';
import './AdminDelivery.css';


export const AdminDelivery = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [artifacts, setArtifacts] = useState([]);
  const [page, setPage] = useState('/api/arts/js');
  const [alert, setAlert] = useState(false);
  const [onSending, setOnSending] = useState(false);
  const [buckets, setBuckets] = useState([]);
  const [toDelete, setToDelete] = useState(undefined);
  



  const fetchArtifacts = async () => {

    try {
  
      const artifact = page.split('/',4)[3];
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/artifacts/get/${artifact}`, {
        headers: { 'x-token': Cookies.get('x-token') },
      });
      
      const data = await res.json();
      
      setArtifacts(data.files);

    } catch (error) {
      toast.error("Error fetching files");
    }
    
  };

  const fetchBuckets = async () => {

    try {
  
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/artifacts/buckets/get/`, {
        headers: { 'x-token': Cookies.get('x-token') },
      });
      const data = await res.json();

      if (!data.ok) {
        toast.error("Error fetching buckets");
        return;
      }
            
      if (!data.items || data.items.length < 1) {
        toast.error("No files");
        return;        
      }

      setBuckets(data.items);
      
    } catch (error) {
      toast.error("Error fetching buckets")      
    }
    
    //setUsers(data.users);
  };

 
  const handleEditClick = (page) => setPage(page);

  
  useEffect(()=>{
    fetchArtifacts();
    fetchBuckets();
  },[page])

  const handleUpload = async () => {
    if (!file) return;

    try {
      setOnSending(true);
      const artifact = page.split('/',4)[3];
      
      
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/artifacts/upload/${artifact}`, {
        method: 'POST',
        body: formData,
        headers: {
          "x-token": `${Cookies.get('x-token')}`
        }
      });
      
      const result = await response.json();
      
      if(result.ok){
        toast.success(result.msg)
        fetchArtifacts();
      }else{
        toast.error(result.msg)
      }
      
    } catch (error) {
      
      toast.error(error)
    }
    setFile(undefined);
    setOnSending(false);
  };


  const handleCreateBucket = async () => {
    
    try {
      setOnSending(true);
      
      let name="default"
      name = prompt("Insert bucket name");
      
      if (name.length < 1) {
        setOnSending(false);
        return;
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/artifacts/buckets/create/`, {
        method: 'POST',
        body: JSON.stringify({name}),
        headers: {
          "x-token": `${Cookies.get('x-token')}`,
          "Content-Type": "application/json"
        }
      });
      
      const result = await response.json();
      
      if(result.ok){
        toast.success("Bucket has been created")
        setTimeout(()=>{
          fetchArtifacts();
          fetchBuckets();
          setOnSending(false);
        },1000)
      }else{
        toast.error(result.msg)
        setTimeout(()=>{
          fetchArtifacts();
          fetchBuckets();
          setOnSending(false);
        },1000)
      }
    } catch (error) {
      toast.error(error)
      setOnSending(false);
    }
  };



  const delete_artifact = async (filename) => {
    setOnSending(true);

    try {

      const artifact = page.split('/',4)[3];
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/artifacts/delete/${artifact}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-token': Cookies.get('x-token')
        },
        body:JSON.stringify({filename})
      });
      
      const response = await res.json();
      if (response.ok) {
        toast.success("Archivo eliminado");

        setTimeout(()=>{
          fetchArtifacts();
          fetchBuckets();
          setOnSending(false);

        }, 1000)

      } else {
        toast.error(response.msg);
        setTimeout(()=>{
          fetchArtifacts();
          fetchBuckets();
          setOnSending(false);
          
        }, 1000)
      }
    } catch (error) {
      toast.error(response.error);
      setOnSending(false);
    }



  }
  const delete_bucket = async () => {

    setOnSending(true);
    try {

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/artifacts/buckets/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-token': Cookies.get('x-token')
        },
        body:JSON.stringify({name:toDelete})
      });
      
      const response = await res.json();
      if (response.ok) {
        toast.success("Bucket deleted");
        setTimeout(()=>{
          fetchArtifacts();
          fetchBuckets();
          setOnSending(false);
        }, 1000)

      } else {
        toast.error("Server error");
        setTimeout(()=>{
          fetchArtifacts();
          fetchBuckets();
          setOnSending(false);
        }, 1000)

      }
    } catch (error) {
      toast.error(response.error);
      setOnSending(false);
    }

    setToDelete(undefined);
  }

  return (
    <div className="delivery-register-container">
      <h3>Bucket</h3>
      <h4>{import.meta.env.VITE_API_URL_BUCKETS}{page}/</h4>
      <p>
        Upload files in an c2c bucket with the purpose of deliver files in infected devices, this files can be webshells, bash and powershell scripts, binaries, etc.
        But be careful, all buckets can be accesed by everybody, do not upload sensitive information.
        You can use the link of each file to deliver them. Happy hacking
      </p>
      <div className="delivery-form-section">
        

        {user?.role === "admin" &&
          <form className='delivery-form' onSubmit={(e)=>e.preventDefault()} noValidate>

            {!onSending &&
              <>
                <div className="delivery-edit-btns">
                  <h4>Upload file</h4>
                  <input className="file-upload " type="file" onChange={(e) => setFile(e.target.files[0])} />
                  <button onClick={handleUpload}>Upload file</button>
                </div>
                <div className="delivery-edit-btns">
                  <button onClick={handleCreateBucket}>Create bucket</button>
                </div>
              </>
            }

          </form>

        }
        <ul className="delivery-files-container">
          { !onSending ? 

            
              !artifacts || artifacts.length === 0 ? <p>Empty bucket</p>
              :
              
              artifacts.map((ar)=><li className='art-file-li'>
                <Link target='blank' style={{ textDecoration: 'none', backgroundColor:'transparent', height:'100%'}} to={`${import.meta.env.VITE_API_BUCKET_URL}${page}/${ar}`}>📄{ar}</Link> 
                
                {user?.role === "admin" &&
                  <button className='delivery-delete-art' onClick={()=> delete_artifact(ar)}>Delete</button>
                }
                </li>
                )

            :

            <li>Loading..</li>
          }


        </ul>

        <div className="delivery-artifact-list">
          <h4>Bucket list </h4>
          {!onSending &&
            <ul>
            { buckets && buckets.length > 0 ? 
            
              buckets.map((b,i)=>(
                <li className='li-bucket' key={i}>
                  <div className='div-bucket'  onClick={() => handleEditClick(`/api/arts/${b}`)}  >
                    📁 {b} 
                  </div>
                  {user?.role === "admin" &&

                    <button className='delivery-delete-art' onClick={()=>{ 
                      setToDelete(b);
                      setAlert(true);
                    } }>Delete</button>
                  }
                </li>))

            :
              <li>No buckets available</li>
              
            }
            </ul>
          }
        </div>

      </div>


      <AlertModal
        visible={alert}
        onClose={() => setAlert(false)}
        onConfirm={() => delete_bucket()}
        title="Warning! Bucket will be deleted"
        description="All files in bucket will be deleted"
        confirmText="Confirm"
        cancelText="Cancel"

      />
      <ToastContainer
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

    </div>
  );
};
