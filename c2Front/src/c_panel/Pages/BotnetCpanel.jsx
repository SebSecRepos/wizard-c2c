import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../../Styles/visualization.css'
import { WindowsTerminal } from '../Components/WindowsTerminal';
import { LinuxTerminal } from '../Components/LinuxTerminal';
import './implant.css'
import { TopBar } from '../Components/TopBar';
import { UploadFile } from '../Components/UploadFile';
import { BottomBar } from '../Components/BottomBar';
import FileExplorer from '../Components/FileExplorer';
import { useAuthStore } from '../../hooks';
import { linuxOperationsArray, windowsOperationsArray } from '../../Utils/operations';

import Cookies from 'js-cookie';
import { BotnetTerminal } from '../Components/BotnetTerminal';

export const BotnetCpanel = () => {

  const [implant, setImplant] = useState(undefined);
  const [externalCmd, setExternalCmd] = useState("");
  /* const [openSideBar, setOpenSidebar] = useState(false); */

  const { id } = useParams(); // obtiene el parámetro 'id' de la URL
  const navigate = useNavigate()
  const { startLogOut } = useAuthStore();


    return <BotnetTerminal />
      
      
};

