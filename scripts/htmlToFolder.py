import os
import shutil 
from bs4 import BeautifulSoup
import chardet

def move_html_files(src_dir, dest_dir): 
    if not os.path.exists(dest_dir):
        os.makedirs(dest_dir)
     
    for root, dirs, files in os.walk(src_dir):
        for file in files: 
            if file.endswith(".html"):
                src_file = os.path.join(root, file)
                dest_file = os.path.join(dest_dir, file)
 
                if os.path.exists(dest_file):
                    base, ext = os.path.splitext(file)
                    counter = 1
                    while os.path.exists(dest_file):
                        dest_file = os.path.join(dest_dir, f"{base}_{counter}{ext}")
                        counter += 1
                 
                shutil.move(src_file, dest_file)
                print(f"Moved successfully ---------- {file} ")
 
src_directory = "./old-HTML" 
dest_directory = "onlyHtml"
 
move_html_files(src_directory, dest_directory) 




def clean_html(file_path): 
    with open(file_path, 'rb') as file: 
        raw_data = file.read()
        detected_encoding = chardet.detect(raw_data)['encoding']
 
    with open(file_path, 'r', encoding=detected_encoding, errors='ignore') as file:
        soup = BeautifulSoup(file, 'lxml')

    for tag in ['head', 'style', 'script', 'meta']:
        for element in soup.find_all(tag):
            element.decompose()  

    # UTF-8 encoding while writing to support all characters
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(str(soup))



def process_html_files_in_folder(folder_path): 
    if not os.path.isdir(folder_path):
        print(f"Folder {folder_path} does not exist.")
        return
 
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
         
        if filename.endswith(".html") and os.path.isfile(file_path):
            print(f"Washing on {filename}...")
            clean_html(file_path)

    print("Html file washed successfully.")
  
process_html_files_in_folder(dest_directory)
