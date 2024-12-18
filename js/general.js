const addCardBtn = document.querySelector('.add-card');
const popUp = document.querySelector('.add-card-form');
const closeBtn = document.querySelector('.close-popup');

addCardBtn.addEventListener('click', () => {
  popUp.style.display = 'flex';
});

closeBtn.addEventListener('click', () => {
  popUp.style.display = 'none';
});