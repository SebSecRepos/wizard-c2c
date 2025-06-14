import React, { useEffect, useState } from "react";

export default function FileExplorer({id=""}) {
  const [currentPath, setCurrentPath] = useState("/");
  const [items, setItems] = useState([]);

  // Cargar archivos del path actual
  const listFiles = async (path) => {
    try {
      const res = await fetch(`http://localhost:4000/api/rcv/get_files/${id}?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
        setCurrentPath(path);
      } else {
        alert(data.error || "Error desconocido");
      }
    } catch (err) {
      alert("Error al cargar archivos");
      console.error(err);
    }
  };

  // Ir a una carpeta
  const openFolder = (folderName) => {
    const newPath = currentPath.endsWith("/")
      ? currentPath + folderName
      : currentPath + "/" + folderName;
    listFiles(newPath);
  };

  // Descargar archivo desde backend Node
  const downloadFile = (fileName) => {
    const fullPath = `${currentPath}/${fileName}`;
    window.open(`http://localhost:4000/api/rcv/download/${id}?path=${encodeURIComponent(fullPath)}`);
  };

  useEffect(() => {
    listFiles("/");
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3">Explorador de archivos: {currentPath}</h2>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="cursor-pointer hover:text-blue-600">
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
