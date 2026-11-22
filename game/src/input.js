// input.js — keyboard controls: 1-7 pick a hand card, Enter ends the turn,
// Escape cancels a selection. Mouse clicks are wired by render.js.
export function bindKeyboard(driver) {
  window.addEventListener('keydown', (event) => {
    if (event.key >= '1' && event.key <= '7') {
      driver.onSelectCard(Number(event.key) - 1);
    } else if (event.key === 'Enter') {
      driver.onEndTurn();
    } else if (event.key === 'Escape') {
      driver.onDeselect();
    }
  });
}
