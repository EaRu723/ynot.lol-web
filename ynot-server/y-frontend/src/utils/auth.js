export const refreshToken = async () => {
    const refreshToken = sessionStorage.getItem("refresh_token");
    if (!refreshToken) return false;
  
    try {
      const response = await fetch("/api/refresh-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
  
      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem("access_token", data.access_token);
        return true;
      } else {
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