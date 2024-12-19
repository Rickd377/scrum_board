const addCardBtn = document.querySelector('.add-card');
const popUp = document.querySelector('.add-card-form');
const closeBtn = document.querySelector('.close-popup');
const form = document.querySelector('.add-card-form form');

addCardBtn.addEventListener('click', () => {
  popUp.style.display = 'flex';
});

closeBtn.addEventListener('click', () => {
  popUp.style.display = 'none';
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const cardData = {
    id: `card-${Date.now()}`,
    sprint: formData.get('sprint'),
    title: formData.get('title'),
    description: formData.get('description'),
    points: formData.get('points'),
    names: formData.get('names').split(',').map(name => name.trim()),
    color: formData.get('color')
  };
  addCardToBoard(cardData, 'to-do-board');
  saveBoardState();
  popUp.style.display = 'none';
  form.reset();
});

// Drag and Drop functionality
const boards = document.querySelectorAll('.board-main > div');

function addCardToBoard(cardData, boardId) {
  const board = document.querySelector(`.${boardId}`);
  const card = document.createElement('div');
  card.classList.add('card');
  card.id = cardData.id;
  card.style.setProperty('--b', cardData.color);
  card.setAttribute('draggable', true);
  card.innerHTML = `
    <div class="sticker">
      <span class="card-sprint">${cardData.sprint}</span>
      <span class="card-title">${cardData.title}</span>
      <i class="fa-solid fa-times"></i>
      <div class="shadow"></div>
    </div>
    <div class="description-card">${cardData.description}</div>
    <div class="points-card">${cardData.points}</div>
    <div class="bottom-card">
      ${cardData.names.map(name => `<div class="name" data-state="none">${name}</div>`).join('')}
    </div>
  `;
  board.appendChild(card);
  addDragAndDropListeners(card);
  addDeleteListener(card);
  addNameClickListener(card);
}

function addDragAndDropListeners(card) {
  card.addEventListener('dragstart', (e) => {
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.target.id);
    setTimeout(() => {
      e.target.classList.add('hide');
    }, 0);
  });

  card.addEventListener('dragend', (e) => {
    e.target.classList.remove('hide');
    e.target.classList.remove('dragging');
    saveBoardState();
  });

  card.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  card.addEventListener('drop', (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const draggable = document.getElementById(id);
    if (draggable) {
      const board = e.target.closest('.board-main > div');
      board.appendChild(draggable);
      saveBoardState();
    } else {
      console.error('Draggable element not found:', id);
    }
  });
}

function addDeleteListener(card) {
  const deleteIcon = card.querySelector('.fa-times');
  deleteIcon.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete this card?')) {
      card.remove();
      saveBoardState();
    }
  });
}

function addNameClickListener(card) {
  const names = card.querySelectorAll('.name');
  names.forEach(name => {
    name.dataset.state = 'none';

    name.addEventListener('click', () => {
      switch (name.dataset.state) {
        case 'none':
          name.style.outline = '2px solid black';
          name.style.borderRadius = '50%';
          name.style.textDecoration = 'none';
          name.style.color = 'black';
          name.dataset.state = 'border';
          break;
        case 'border':
          name.style.outline = 'none';
          name.style.textDecoration = 'line-through';
          name.style.color = '#888';
          name.dataset.state = 'line-through';
          break;
        case 'line-through':
          name.style.outline = 'none';
          name.style.textDecoration = 'none';
          name.style.color = 'black';
          name.dataset.state = 'none';
          break;
      }
      saveBoardState(); // Save state after each click
    });
  });
}

boards.forEach(board => {
  board.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(board, e.clientY);
    const draggable = document.querySelector('.dragging');
    if (draggable) {
      if (afterElement == null) {
        board.appendChild(draggable);
      } else {
        board.insertBefore(draggable, afterElement);
      }
    } else {
      console.error('Draggable element not found during dragover');
    }
  });

  board.addEventListener('dragenter', (e) => {
    e.preventDefault();
    board.classList.add('drag-over');
  });

  board.addEventListener('dragleave', (e) => {
    if (!board.contains(e.relatedTarget)) {
      board.classList.remove('drag-over');
    }
  });

  board.addEventListener('drop', (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const draggable = document.getElementById(id);
    if (draggable) {
      board.appendChild(draggable);
      board.classList.remove('drag-over');
      saveBoardState();
    } else {
      console.error('Draggable element not found:', id);
    }
  });
});

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.card:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function saveBoardState() {
  const boardState = [];
  boards.forEach(board => {
    const boardId = board.classList[0];
    const cards = [...board.querySelectorAll('.card')];
    const cardData = cards.map(card => {
      const names = [...card.querySelectorAll('.name')].map(name => ({
        text: name.textContent,
        state: name.dataset.state
      }));
      return {
        id: card.id,
        sprint: card.querySelector('.card-sprint').textContent,
        title: card.querySelector('.card-title').textContent,
        description: card.querySelector('.description-card').textContent,
        points: card.querySelector('.points-card').textContent,
        names: names,
        color: card.style.getPropertyValue('--b')
      };
    });
    boardState.push({ boardId, cardData });
  });
  console.log('Saving board state:', boardState); // Debugging line
  localStorage.setItem('boardState', JSON.stringify(boardState));
  fetch('http://localhost/Rick/scrum_board/cards.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(boardState)
  }).then(response => response.json())
    .then(data => {
      console.log('Save response:', data);
    })
    .catch(error => {
      console.error('Error saving board state:', error);
    });
}

function loadBoardState() {
  const savedState = localStorage.getItem('boardState');
  if (savedState) {
    const boardState = JSON.parse(savedState);
    console.log('Loaded board state from localStorage:', boardState); // Debugging line
    boardState.forEach(board => {
      const boardElement = document.querySelector(`.${board.boardId}`);
      board.cardData.forEach(cardData => {
        addCardToBoard(cardData, board.boardId);
        const cardElement = document.getElementById(cardData.id);
        cardData.names.forEach((nameData, index) => {
          const nameElement = cardElement.querySelectorAll('.name')[index];
          nameElement.textContent = nameData.text; // Ensure only the text is displayed
          nameElement.dataset.state = nameData.state;
          switch (nameData.state) {
            case 'border':
              nameElement.style.outline = '2px solid black';
              nameElement.style.borderRadius = '50%';
              nameElement.style.textDecoration = 'none';
              nameElement.style.color = 'black';
              break;
            case 'line-through':
              nameElement.style.outline = 'none';
              nameElement.style.textDecoration = 'line-through';
              nameElement.style.color = '#888';
              break;
            case 'none':
            default:
              nameElement.style.outline = 'none';
              nameElement.style.textDecoration = 'none';
              nameElement.style.color = 'black';
              break;
          }
        });
      });
    });
  } else {
    fetch('http://localhost/Rick/scrum_board/cards.php')
      .then(response => response.json())
      .then(boardState => {
        console.log('Loaded board state from server:', boardState); // Debugging line
        boardState.forEach(board => {
          const boardElement = document.querySelector(`.${board.boardId}`);
          board.cardData.forEach(cardData => {
            addCardToBoard(cardData, board.boardId);
            const cardElement = document.getElementById(cardData.id);
            cardData.names.forEach((nameData, index) => {
              const nameElement = cardElement.querySelectorAll('.name')[index];
              nameElement.textContent = nameData.text; // Ensure only the text is displayed
              nameElement.dataset.state = nameData.state;
              switch (nameData.state) {
                case 'border':
                  nameElement.style.outline = '2px solid black';
                  nameElement.style.borderRadius = '50%';
                  nameElement.style.textDecoration = 'none';
                  nameElement.style.color = 'black';
                  break;
                case 'line-through':
                  nameElement.style.outline = 'none';
                  nameElement.style.textDecoration = 'line-through';
                  nameElement.style.color = '#888';
                  break;
                case 'none':
                default:
                  nameElement.style.outline = 'none';
                  nameElement.style.textDecoration = 'none';
                  nameElement.style.color = 'black';
                  break;
              }
            });
          });
        });
      })
      .catch(error => {
        console.error('Error loading board state:', error);
      });
  }
}

// Load the board state when the page loads
document.addEventListener('DOMContentLoaded', loadBoardState);