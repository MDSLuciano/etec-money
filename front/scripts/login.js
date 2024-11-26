const baseUrl = "http://localhost:3333/auth/login";
const formulario = document.getElementById("formLogin");

function saveToken(token) {
  //TODO: Salvar o Token do LocalStorage "jwt"
  localStorage.setItem("token", token);
}

if (formulario) {
  formulario.addEventListener("submit", async function (event) {
    event.preventDefault();

    // Captura os valores dos campos
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    // Cria um objeto com os dados do formulário
    const dados = {
      email: email,
      password: senha,
    };

    const resposta = await fetch(`${baseUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
    });

    const data = await resposta.json();

    if (!resposta.ok) {
      if (data.error) alert("Erro: " + data.error);
      else alert("Erro: " + data.message);
      return;
    }

    saveToken(data.token);

    // TODO: Redirecionar para a pagina index.html
    window.location.href = "index.html";
    // Limpa os campos do formulário
    formulario.reset();
  });
} else {
  console.error("Formulário não encontrado!");
}
