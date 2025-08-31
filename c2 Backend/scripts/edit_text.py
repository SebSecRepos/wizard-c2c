import argparse
import base64


def parse_arguments():
    parser = argparse.ArgumentParser(description="Edit python script" )
    parser.add_argument("-f", "--file", required=True, dest="file", help="ex: -f file.exe")
    parser.add_argument("-u", "--url", required=False, dest="url", help="ex: -u 'localhost'")
    parser.add_argument("-p", "--port", required=False, dest="port", help="ex: -p 4444")
    parser.add_argument("-g", "--group", required=False, dest="group", help="ex: -g 'group1'")

    options = parser.parse_args()

    return options.file, options.url, options.port, options.group


def add_text(script_path,  url, port, group):

    replacmente = ""    
    with open(script_path, 'r') as f_in, open(str(script_path).replace("base.py", "base_copy.py"), "w") as f_out:
        replacement = f_in.read().replace("localhost", str(url)).replace("4444", str(port)).replace("grupo", str(group))
        f_out.write(replacement)
    

def main():
    file, url, port, group = parse_arguments()
    add_text(file, url, port, group)


if __name__ == "__main__":
    main()