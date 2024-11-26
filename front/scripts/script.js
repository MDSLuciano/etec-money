const baseUrl = "http://localhost:3333";
let loadingSpinner;
let overlay;

const params = new URLSearchParams({
  order: "asc",
});

function getToken() {
  //TODO: Pegar o Token do LocalStorage "jwt" e retornar
  return localStorage.getItem("token");
}

const token = getToken();

function backToLogin() {
  // TODO: Redirecionar para a pagina login.html
  window.location.href = "login.html";
}

function openModal(isEdit) {
  if (isEdit) {
    document.getElementById("Modal-Title").innerHTML = "Editar Transação";
    document.getElementById("button-save").style.display = "none";
    document.getElementById("button-edit").style.display = "block";
  } else {
    document.getElementById("Modal-Title").innerHTML = "Adicionar Transação";
    document.getElementById("button-save").style.display = "block";
    document.getElementById("button-edit").style.display = "none";
  }

  document.getElementById("modal").showModal();
}

function closeModal() {
  document.getElementById("modal").close();
}

document.addEventListener("DOMContentLoaded", async function () {
  loadingSpinner = document.getElementById("loading");
  overlay = document.getElementById("overlay");
  tableSearch();
  refreshData();
});

async function refreshData() {
  await getSummary();
  await listTransactions();
}

function clearData() {
  document.getElementById("transaction-id").value = "";
  document.getElementById("title").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("type-transaction").value = "credit";
}

async function getSummary() {
  try {
    //TODO: Adicionar o Header com o Authorization, passando o Token para a requisição
    const response = await fetch(baseUrl + "/transactions/summary",
      {
        headers: {
          Authorization : `Bearer ${token}`,
        }
      })


    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    let totalCredit = data.summary.totalCredit;
    let totalDebit = data.summary.totalDebit;
    let netBalance = data.summary.netBalance;

    document.getElementById("balance").innerText = `R$ ${netBalance}`;
    document.getElementById("total-income").innerText = `R$ ${totalCredit}`;
    document.getElementById("total-expense").innerText = `R$ ${totalDebit}`;
  } catch (err) {
    //TODO: Chamar o método de voltar para o login
    backToLogin();
  }
}

async function listTransactions() {
  overlay.style.display = "block";
  loadingSpinner.style.display = "block";
  const tbody = document.getElementById("table-body");

  tbody.innerHTML = "";

  try {
    //TODO: Adicionar o Header com o Authorization, passando o Token para a requisição
    const response = await fetch(`${baseUrl}/transactions?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    data.transactions.forEach((transaction) => {
      const dateObj = new Date(transaction.createdAt);

      const formattedDate = dateObj.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      if (transaction.type === "debit") {
        const newRow = `
    <tr id="${transaction.id}" class="bg-gray-800 border-b border-gray-700">
            <td class="px-6 py-4">${transaction.id}</td>
            <th class="px-6 py-4 font-medium text-white">${transaction.title}</th>
            <td class="px-6 py-4 text-red-400">R$ ${transaction.amount}</td>
            <td class="px-6 py-4">${formattedDate}</td>
            <td class="px-6 py-4 text-right">
              <a onclick="listOneTransaction(${transaction.id})" class="font-medium text-blue-500 cursor-pointer hover:underline pe-3">Editar</a>
              <a onclick="deleteTransaction(${transaction.id})" class="font-medium text-blue-500 cursor-pointer hover:underline">Excluir</a>
            </td>
          </tr>
    `;

        tbody.innerHTML += newRow;
      } else {
        const newRow = `
    <tr id="${transaction.id}" class="bg-gray-800 border-b border-gray-700">
            <td class="px-6 py-4">${transaction.id}</td>
            <th class="px-6 py-4 font-medium text-white">${transaction.title}</th>
            <td class="px-6 py-4 text-green-400">R$ ${transaction.amount}</td>
            <td class="px-6 py-4">${formattedDate}</td>
            <td class="px-6 py-4 text-right">
              <a onclick="listOneTransaction(${transaction.id})" class="font-medium text-blue-500 cursor-pointer hover:underline pe-3">Editar</a>
              <a onclick="deleteTransaction(${transaction.id})" class="font-medium text-blue-500 cursor-pointer hover:underline">Excluir</a>
            </td>
          </tr>
    `;

        tbody.innerHTML += newRow;
      }
    });

    renderPagination(data.page, data.totalPages);
  } catch (err) {
    //TODO: Chamar o método de voltar para o login
    backToLogin();
  }

  overlay.style.display = "none";
  loadingSpinner.style.display = "none";
}

async function listOneTransaction(id) {
  try {
    //TODO: Adicionar o Header com o Authorization, passando o Token para a requisição
    const response = await fetch(`${baseUrl}/transactions/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    document.getElementById("transaction-id").value = data.transaction.id;
    document.getElementById("title").value = data.transaction.title;
    document.getElementById("amount").value = data.transaction.amount;
    document.getElementById("type-transaction").value = data.transaction.type;

    openModal(true);
  } catch (err) {
    //TODO: Chamar o método de voltar para o login
    backToLogin();
  }
}

async function saveTransaction() {
  var transaction = {
    title: document.getElementById("title").value,
    amount: Number(document.getElementById("amount").value),
    type: document.getElementById("type-transaction").value,
  };

  try {
    //TODO: Adicionar o Header com o Authorization, passando o Token para a requisição
    const response = await fetch(`${baseUrl}/transactions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(transaction),
    },
);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    closeModal();
  } catch (err) {
    //TODO: Chamar o método de voltar para o login
    backToLogin();
  }

  refreshData();
  clearData();
}

async function editTransaction() {
  var transaction = {
    id: document.getElementById("transaction-id").value,
    title: document.getElementById("title").value,
    amount: Number(document.getElementById("amount").value),
    type: document.getElementById("type-transaction").value,
  };

  try {
    //TODO: Adicionar o Header com o Authorization, passando o Token para a requisição
    const response = await fetch(`${baseUrl}/transactions/${transaction.id}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(transaction),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    closeModal();
    refreshData();
    clearData();
  } catch (err) {
    //TODO: Chamar o método de voltar para o login
    backToLogin();
  }
}

async function deleteTransaction(id) {
  try {
    const response = await fetch(`${baseUrl}/transactions/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    closeModal();
  } catch (err) {
    backToLogin();
  }

  refreshData();
}

function renderPagination(currentPage, totalPages) {
  const paginationDiv = document.getElementById("pagination");
  paginationDiv.innerHTML = "";

  // Botão "Anterior"
  const prevLi = document.createElement("li");
  const prevButton = document.createElement("a");
  prevButton.innerHTML = "<";
  prevButton.className = "flex items-center justify-center px-3 h-8 ms-0 text-gray-400 bg-gray-800 border border-gray-700 rounded-s-lg cursor-pointer hover:bg-gray-700 hover:text-white";
  prevButton.onclick = (event) => {
    if (currentPage > 1) {
      params.set("page", currentPage - 1);
      listTransactions();
    }
  };

  if (currentPage === 1) prevButton.classList.add("opacity-50", "pointer-events-none");
  prevLi.appendChild(prevButton);
  paginationDiv.appendChild(prevLi);

  // Botões das páginas
  for (let i = 1; i <= totalPages; i++) {
    const pageLi = document.createElement("li");
    const pageButton = document.createElement("a");
    pageButton.textContent = i;
    pageButton.className = `flex items-center justify-center px-3 h-8 ${i === currentPage ? "text-white bg-gray-700" : "text-gray-400 bg-gray-800 hover:bg-gray-700 cursor-pointer hover:text-white"} border border-gray-700`;
    pageButton.onclick = (event) => {
      params.set("page", i);
      listTransactions();
    };
    pageLi.appendChild(pageButton);
    paginationDiv.appendChild(pageLi);
  }

  // Botão "Próximo"
  const nextLi = document.createElement("li");
  const nextButton = document.createElement("a");
  nextButton.innerHTML = ">";
  nextButton.className = "flex items-center justify-center px-3 h-8 text-gray-400 bg-gray-800 border border-gray-700 rounded-e-lg cursor-pointer hover:bg-gray-700 hover:text-white";
  nextButton.onclick = (event) => {
    if (currentPage < totalPages) {
      params.set("page", currentPage + 1);
      listTransactions();
    }
  };

  if (currentPage === totalPages) nextButton.classList.add("opacity-50", "pointer-events-none");
  nextLi.appendChild(nextButton);
  paginationDiv.appendChild(nextLi);
}

function tableSearch() {
  document.getElementById("table-search").addEventListener("keydown", function (event) {
    const title = event.target.value.trim();
    if (event.key === "Enter") {
      if (title !== "") {
        params.set("title", title);
      } else {
        params.delete("title");
      }
      listTransactions();
    } else if (event.key === "Backspace" && event.target.value == "") {
      params.delete("title");
      listTransactions();
    }
  });
}

function applyFilter(filterType) {
  toggleDropdown(); //Fecha o dropdown após click no filtro
  if (filterType === "debit") {
    params.set("type", filterType);
  } else if (filterType === "credit") {
    params.set("type", filterType);
  } else {
    params.delete("type");
  }

  listTransactions();
}

function toggleDropdown() {
  document.getElementById("dropdown").classList.toggle("hidden");
}

window.onclick = function (event) {
  if (!event.target.matches(".inline-flex")) {
    const dropdown = document.getElementById("dropdown");
    if (!dropdown.classList.contains("hidden")) {
      dropdown.classList.add("hidden");
    }
  }
};
