# 13 Bubbles - js13k2024

13 Bubbles is a twist on the classic Bubble Pop kind of game.

Here, to be able to pop bubbles, not only the group has to be of the same color but the sum of all its values must be a multiple of 13 (0 and negatives included). Reach bigger sums (26 or -26, 39 or -39, etc...) to multiply your score! To avoid headaches from too much calculus, hover your mouse on a bubble group to get the current sum of values and the closest multiples.

Try to survive as long as possible by preventing the bubbles to get to the bottom of the screen, and if 2 or 3 colors are too easy for you, why not try the hard mode?

Controls:
- Change Bubble Color: Mouse Wheel
- Shoot: Mouse click
- Toggle sounds: M
- Pause: Escape

## Known bugs

- When performance is low, sometimes the bubble overwrite an existing one in the grid.

## Libraries and tools used

- Vite.js for developping and building: https://vitejs.dev/
- This cheat sheet for Canvas 2D: https://simon.html5.org/dump/html5-canvas-cheat-sheet.html
- The ZzFX and ZzFXM librairies
  - https://killedbyapixel.github.io/ZzFX/
  - https://keithclark.github.io/ZzFXM/
  - https://keithclark.github.io/ZzFXM/tracker/