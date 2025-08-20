import sys
import argparse
from pathlib import Path

def find_string_patterns(file_path, search_strings):
    """Busca patrones de cadenas en el archivo binario"""
    with open(file_path, 'rb') as f:
        content = f.read()
    
    results = {}
    
    for search_str in search_strings:
        # Buscar en UTF-16-LE
        utf16_pattern = search_str.encode('utf-16-le')
        utf16_pos = content.find(utf16_pattern)
        
        # Buscar en UTF-16-LE con terminador nulo
        utf16_null_pattern = utf16_pattern + b'\x00\x00'
        utf16_null_pos = content.find(utf16_null_pattern)
        
        # Buscar en UTF-8 (por si acaso)
        utf8_pattern = search_str.encode('utf-8')
        utf8_pos = content.find(utf8_pattern)
        
        results[search_str] = {
            'utf16_le': utf16_pos,
            'utf16_le_null': utf16_null_pos,
            'utf8': utf8_pos
        }
    
    return results, content

def main():
    parser = argparse.ArgumentParser(description='Analizar patrones en el ejecutable')
    parser.add_argument('file', help='Ruta al ejecutable compilado')
    
    args = parser.parse_args()
    
    file_path = Path(args.file)
    if not file_path.exists():
        print(f"Error: El archivo {args.file} no existe")
        return
    
    # Cadenas a buscar
    search_strings = [
        "ws://127.0.0.1:4000/api/rcv",
        "http://127.0.0.1:4000",
        "127.0.0.1:4000",
        "Remote 2",
        "/api/impl/new/"
    ]
    
    results, content = find_string_patterns(file_path, search_strings)
    
    print("Resultados del análisis:")
    print("=" * 60)
    
    for string, positions in results.items():
        print(f"Cadena: {string}")
        print(f"  UTF-16-LE: {positions['utf16_le']} {'✓' if positions['utf16_le'] != -1 else '✗'}")
        print(f"  UTF-16-LE+Null: {positions['utf16_le_null']} {'✓' if positions['utf16_le_null'] != -1 else '✗'}")
        print(f"  UTF-8: {positions['utf8']} {'✓' if positions['utf8'] != -1 else '✗'}")
        print()
    
    # Mostrar fragmentos hexadecimales alrededor de las coincidencias
    print("Fragmentos hexadecimales:")
    print("=" * 60)
    
    for string, positions in results.items():
        if positions['utf16_le_null'] != -1:
            pos = positions['utf16_le_null']
            start = max(0, pos - 10)
            end = min(len(content), pos + len(string) * 2 + 20)
            hex_data = content[start:end].hex()
            print(f"{string} en posición {pos}:")
            print(' '.join(hex_data[i:i+2] for i in range(0, len(hex_data), 2)))
            print()

if __name__ == "__main__":
    main()