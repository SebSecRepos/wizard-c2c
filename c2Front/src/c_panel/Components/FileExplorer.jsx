import React, { useEffect, useState } from "react";
import './fileExplorer.css'
import Cookies from "js-cookie";
import { toast, ToastContainer } from "react-toastify";


export default function FileExplorer({id="", openExplorer=false, setOpenExplorer}) {
  const [currentPath, setCurrentPath] = useState("/");
  const [items, setItems] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);

  // Cargar archivos del path actual
  const listFiles = async (path) => {
    try {
      const url = `${import.meta.env.VITE_API_URL}/api/rcv/get_files/`;
      const res = await fetch(url,{
        method:'POST',
        headers:{
         "Content-Type": "application/json",
         "x-token": Cookies.get('x-token')
        },
        body:JSON.stringify({
          path,
          id
        })
      });
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
        setCurrentPath(path);
      } else {
        toast.error(data.error || "Error desconocido");
      }
    } catch (err) {
      toast.error("Error al cargar archivos");
      console.error(err);
    }
  };

  // Ir a una carpeta
  const openFolder = (folderName) => {
    const segments = currentPath.split("/").filter(Boolean);

    if (folderName === "..") {
      segments.pop();
    } else {
      segments.push(folderName); 
    }

    const normalizedPath = "/" + segments.join("/");
    listFiles(normalizedPath);
  };

  // Descargar archivo desde backend Node
const downloadFile = async (fileName) => {
  setIsDownloading(true);
  const fullPath = `${currentPath}/${fileName}`;
  const url = `${import.meta.env.VITE_API_URL}/api/rcv/download/`;

  try {
    const response = await fetch(url, {
      method:'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-token': `${Cookies.get('x-token')}`,
      },
      body:JSON.stringify({
        path:fullPath,
        id
      })
    });

    if (!response.ok) {
      toast.error(response.error)
    }

    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

  } catch (err) {
    toast.error(err);
  }
  finally{
    setTimeout(()=>{setIsDownloading(false);}, 1000)
  }

};

  useEffect(() => {
    listFiles("/");
  }, []);

  return (
    <div className="floating-box-explorer">
      <span className="close" onClick={()=>setOpenExplorer(!openExplorer)}>x</span>
      <h2 className="text-xl font-bold mb-3">Explorador de archivos: {currentPath}</h2>
      <ul className="directory-list">
        {
          isDownloading ? 
           <li><span>Downloading..</span></li>
          :

          <>
            <li><span onClick={() => openFolder("..")}>📁 ..</span></li>
            {items.map((item, idx) => (
              <li key={idx} >
                {item.type === "directory" ? (
                  <span onClick={() => openFolder(item.name)}>📁 {item.name}</span>
                ) : (
                  <span onClick={() => downloadFile(item.name)}>📄 {item.name}</span>
                )}
              </li>
            ))}
          </>
        }
      </ul>
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
}
