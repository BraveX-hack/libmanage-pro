import os
import zipfile
import shutil

def create_project_zip():
    output_filename = "public/BiblioTech_Code_Source_Complet_2GroupESGIS.zip"
    alt_filename = "public/BiblioTech_Source_Code_2GroupESGIS.zip"
    os.makedirs("public", exist_ok=True)
    
    exclude_dirs = {"node_modules", ".git", "dist", ".vite", ".cache"}
    exclude_extensions = {".log", ".tmp"}
    
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk("."):
            # Exclude unwanted directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith(".")]
            
            for file in files:
                if any(file.endswith(ext) for ext in exclude_extensions):
                    continue
                
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, ".")
                
                # Ne pas inclure les archives zip elles-mêmes pour éviter la récursion
                if arcname.startswith("public/BiblioTech_") and arcname.endswith(".zip"):
                    continue
                
                zipf.write(file_path, arcname)
                
    file_size = os.path.getsize(output_filename)
    shutil.copyfile(output_filename, alt_filename)
    print(f"[SUCCÈS] Archive ZIP créée avec succès : {output_filename} ({file_size} octets)")

if __name__ == "__main__":
    create_project_zip()

