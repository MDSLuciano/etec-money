const baseUrl = "http://localhost:3333/auth/register";
const formulario = document.getElementById('formCadastro');

if (formulario) {
  formulario.addEventListener('submit', async function(event) {
    event.preventDefault();

    // Captura os valores dos campos
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const confirmaSenha = document.getElementById('confirma-senha').value;

    // Verifica se a senha e a confirmação de senha são iguais
    if (senha !== confirmaSenha) {
      alert('As senhas não coincidem. Por favor, tente novamente.');
      return;
    }
  
    // Cria um objeto com os dados do formulário
    const dados = { 
      name: nome, 
      email: email, 
      password: senha 
    };

    const resposta = await fetch(`${baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dados)
    });

    if (!resposta.ok) {
      const data = await resposta.json();
      if (data.error) alert("Erro: " + data.error);
      else alert("Erro: " + data.message);
      return;
    }

    // TODO: Redirecionar para a pagina login.html
    window.location.href = 'login.html';
    
    // Limpa os campos do formulário
    formulario.reset();
  });
} else {
  console.error("Formulário não encontrado!");
}
