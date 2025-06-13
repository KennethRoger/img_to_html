import { useEffect, useState } from "react";
const apiUrl = import.meta.env.VITE_API_URL;

// Common format for fetch api
async function fetchApi(url, options) {
  try {
    const response = await fetch(url, options);
    const json = await response.json();
    return json;
  } catch (err) {
    throw err;
  }
}

function App() {
  const [image, setImage] = useState();
  const [file, setFile] = useState();

  const [htmlContent, setHtmlContent] = useState("");
  const [dimension, setDimension] = useState({ height: 0, width: 0 });

  console.log(htmlContent);
  // Function to set image file and url of image
  function handleFileChange(e) {
    const file = e.target.files[0];
    const imgFile = URL.createObjectURL(file);
    setFile(file);
    setImage(imgFile);
  }

  // Function to call fetch api to tranfer image
  async function uploadImage(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetchApi(`${apiUrl}/upload`, {
        method: "POST",
        body: formData,
      });
      setHtmlContent(res.data.html);
      setDimension((prev) => ({
        ...prev,
        height: res.data.height,
        width: res.data.width,
      }));
      console.log(res.message);
    } catch (error) {
      throw error;
    }
  }

  return (
    <>
      <div>
        <img src={image ? image : null} alt="Nothing to see" width={"300px"} />
        <form
          onSubmit={uploadImage}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <input type="file" onChange={handleFileChange} />
          <button type="submit" style={{ width: "50px", marginTop: "20px" }}>
            upload
          </button>
        </form>
      </div>
      <div
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        style={{
          width: `${dimension.width}px`,
          height: `${dimension.height}px`,
        }}
      ></div>
    </>
  );
}

export default App;
