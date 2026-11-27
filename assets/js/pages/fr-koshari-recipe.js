'use strict';

const servings = document.querySelector('#servings');
const list = document.querySelector('#ingredients');
const format = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

function updateServings() {
  const people = Number(servings.value);
  document.querySelector('#ingredients-title').textContent = 'Ingrédients pour ' + people + ' personnes';
  for (const entry of list.querySelectorAll('[data-quantity]')) {
    const quantity = Number(entry.dataset.quantity) * people / 6;
    const unit = quantity >= 2 ? entry.dataset.plural : entry.dataset.unit;
    entry.textContent = format.format(quantity) + ' ' + unit;
  }
}

servings.addEventListener('change', updateServings);
document.querySelector('#download-list').addEventListener('click', () => {
  const lines = ['Koshari égyptien — liste de courses pour ' + servings.value + ' personnes', ''];
  for (const item of list.children) {
    lines.push(item.querySelector('span').textContent + ' : ' + item.querySelector('strong').textContent);
  }
  const url = URL.createObjectURL(new Blob([lines.join('\n') + '\n'], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'koshari-' + servings.value + '-personnes.txt';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
document.querySelector('#recipe-controls').hidden = false;
