import React, { useEffect, useState } from "react";
import './fileExplorer.css'
import Cookies from "js-cookie";
import { toast } from "react-toastify";


export default function FileExplorer({id="", openExplorer=false, setOpenExplorer}) {
  const [currentPath, setCurrentPath] = useState("/");
  const [items, setItems] = useState([]);

  // Cargar archivos del path actual
  const listFiles = async (path) => {
    try {
      const url = `${import.meta.env.VITE_API_URL}/api/rcv/get_files/${id}?path=${encodeURIComponent(path)}&token=${encodeURIComponent(Cookies.get('x-token'))}`;
      const res = await fetch(url);
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
      segments.pop(); // sube un nivel
    } else {
      segments.push(folderName); // entra a subcarpeta
    }

    const normalizedPath = "/" + segments.join("/");
    listFiles(normalizedPath);
  };

  // Descargar archivo desde backend Node
  const downloadFile = (fileName) => {
    const fullPath = `${currentPath}/${fileName}`;
    const url = `${import.meta.env.VITE_API_URL}/api/rcv/download/${id}?path=${encodeURIComponent(fullPath)}&token=${encodeURIComponent(Cookies.get('x-token'))}`;
    console.log(url);
    window.open(url)
  };

  useEffect(() => {
    listFiles("/");
  }, []);

  return (
    <div className="floating-box-explorer">
      <span className="close" onClick={()=>setOpenExplorer(!openExplorer)}>x</span>
      <h2 className="text-xl font-bold mb-3">Explorador de archivos: {currentPath}</h2>
      <ul className="directory-list">
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
      </ul>
    </div>
  );
}
