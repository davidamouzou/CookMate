const chooseImage = (): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";

    input.addEventListener("change", (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];

      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData = e.target?.result as string;
          resolve(imageData);
        };
        reader.onerror = () => {
          reject(new Error("Failed to read the file."));
        };
        reader.readAsDataURL(file);
      } else {
        resolve(null);
      }
    });

    input.click();
  });
};

export default chooseImage;