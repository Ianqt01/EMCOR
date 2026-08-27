document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = document.getElementById("loginMessage");
  message.textContent = "Signing in...";
  try {
    const result = await api("login", {
      username: document.getElementById("username").value.trim(),
      password: document.getElementById("password").value
    });
    localStorage.setItem("emcor_session", JSON.stringify(result.session));
    location.href = "dashboard.html";
  } catch (err) {
    message.textContent = err.message;
  }
});
