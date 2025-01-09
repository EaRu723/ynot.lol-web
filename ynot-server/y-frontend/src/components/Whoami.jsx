import { useEffect, useState } from "react";

function Whoami() {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const [text, setText] = useState("");

  const fetchWhoami = async () => {
    try {
      const response = await fetch(`${API_URL}/whoami`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setText(data.user.handle + " ... " + data.user.did);
        } else {
          setText("user field in response not found");
        }
      } else {
        const data = await response.json();
        setText(data?.detail || "An error occurred");
      }
    } catch (e) {
      console.log(e);
      setText(e.message || "An error occurred 2");
    }
  };

  useEffect(() => {
    fetchWhoami();
  }, []);

  return (
    <div>
      <p>{text}</p>
    </div>
  );
}

export default Whoami;
