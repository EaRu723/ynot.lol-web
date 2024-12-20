export const refreshToken = async () => {
  const URL = import.meta.env.VITE_API_BASE_URL;
  const refreshToken = sessionStorage.getItem("refresh_token");
  if (!refreshToken) {
    alert("Please log in");
    return false;
  }

  try {
    const response = await fetch(`${URL}/token/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();

      return true;
    } else {
      alert("Please log in");
      handleLogout();
      return false;
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
    handleLogout();
    return false;
  }
};

export const handleLogout = () => {
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("handle");
  sessionStorage.removeItem("refresh_token");
  window.location.reload();
};
