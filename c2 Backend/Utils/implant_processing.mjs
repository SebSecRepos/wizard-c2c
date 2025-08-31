import { spawn } from "child_process";
import path from "path";
import fs from 'fs';


const runPowerShellCommand = (args, cwd) => {
    return new Promise((resolve, reject) => {
        const ps = spawn('powershell.exe', args);

        let output = '';
        let errorOutput = '';

        ps.stdout.on('data', (data) => {
            output += data.toString();
        });

        ps.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        ps.on('close', (code) => {
            if (code === 0) {
                resolve(output.trim());
            } else {
                reject(new Error(`PowerShell error: ${errorOutput}`));
            }
        });

        ps.on('error', (err) => {
            reject(err);
        });
    });
};



const python_processing =async(impl_path="",url,port,group)=>{

    console.log(impl_path,url,port,group);
    
    try {
        const copy_path = impl_path.replace('.py', '_copy.py');
        const replace = await runPowerShellCommand([`python`, path.normalize('./scripts/edit_text.py'), '-f', impl_path, '-u', url, '-p', port, '-g', group]);
        console.log("Comandos ejecutados correctamente");
        return `..\\${copy_path}`;
    } catch (error) {
        console.error("Error al ejecutar comandos de PowerShell:", error);
    }
}
const exe_processing =async(impl_path="",url,port,group)=>{

    try {

        const copy_path = impl_path.replace('.exe', '_copy.exe');
        
        const copy = await runPowerShellCommand([`copy`, impl_path, copy_path ]);
        
        const replace = await runPowerShellCommand([`python`, path.normalize('./scripts/append_text.py'), '-f', copy_path, '-t', 'write', '-u', url, '-p', port, '-g', group]);
        
        console.log(copy_path);
        
        return `..\\${copy_path}`;
    } catch (error) {
        console.error("Error al ejecutar comandos de PowerShell:", error);
    }

}
const bin_processing =async(path="",url,port,group)=>{

        try {

        const copy_path = impl_path.replace('.bin', '_copy.bin')
        
        const copy = await runPowerShellCommand([`copy`, impl_path, copy_path ]);
        
        const replace = await runPowerShellCommand([`python`, path.normalize('./scripts/append_text.py'), '-f', copy_path, '-t', 'write', '-u', url, '-p', port, '-g', group]);
        return `..\\${copy_path}`;
    } catch (error) {
        console.error("Error al ejecutar comandos de PowerShell:", error);
    }

}


export { python_processing, exe_processing, bin_processing }


