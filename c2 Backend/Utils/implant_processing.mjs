import { spawn } from "child_process";


const python_processing =async(path="",url,port,group)=>{
}
const exe_processing =async(path="",url,port,group)=>{

    try {
        const out = spawn('powershell.exe', ['Set-Content', '-Path', `"${path}:Route"`, '-Value', `"${url}"`]);
        out.stdout.on('end',(d)=>{
            console.log("close",d);
        })
    
        out.stdout.on('data',(d)=>{
            console.log(d);
        })
        out.stdout.on('error',(d)=>{
            console.log(d);
        })
        
        spawn('powershell.exe', ['Set-Content', '-Path', `"${path}:Port"`, '-Value', `"${port}"`]);
        spawn('powershell.exe', ['Set-Content', '-Path', `"${path}:Group"`, '-Value', `"${group}"`]);
    
    
    } catch (error) {
        console.log(error);
        
    }
    
/*     console.log(`powershell.exe Set-Content -Path ${path}:Route -Value ${url}`);
    console.log(`powershell.exe Set-Content -Path ${path}:Port -Value ${port}`);
    console.log(`powershell.exe Set-Content -Path ${path}:Group -Value ${group}`); */
    

}
const bin_processing =async(path="",url,port,group)=>{

}


export { python_processing, exe_processing, bin_processing }