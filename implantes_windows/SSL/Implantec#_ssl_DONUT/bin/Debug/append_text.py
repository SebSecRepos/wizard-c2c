import argparse
import base64



def parse_arguments():
    parser = argparse.ArgumentParser(description="Read insert binary data" )
    parser.add_argument("-t", "--task", required=True, dest="task", help="ex: -t read")
    parser.add_argument("-f", "--file", required=True, dest="file", help="ex: -f file.exe")
    parser.add_argument("-u", "--url", required=False, dest="url", help="ex: -u 'localhost'")
    parser.add_argument("-p", "--port", required=False, dest="port", help="ex: -p 4444")
    parser.add_argument("-g", "--group", required=False, dest="group", help="ex: -g 'group1'")

    options = parser.parse_args()

    return options.task, options.file, options.url, options.port, options.group


def add_text(ruta_ejecutable,  url, port, group):

    text = f"|{url}|{port}|{group}"

    text_base = f"DATA={base64.b64encode(text.encode('utf-8')).decode('utf-8')}"
    texto_bytes = text_base.encode('utf-16-le')

    # Abrimos el archivo en modo binario y append (añadir al final)
    with open(ruta_ejecutable, 'ab') as f:
        f.write(texto_bytes)
    
    print(text_base)
    #print(texto_bytes)

def read_text(path):

    with open(path, 'rb') as f:
        data=f.read()
        print(data.decode('utf-16-le', errors='ignore'))
    




def main():
    task, file, url, port, group = parse_arguments()


    if task == "read":
        read_text(file)
    elif task == "write":
        add_text(file, url, port, group)
    else:
        print("Error arguments")



if __name__ == "__main__":
    main()