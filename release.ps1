Copy-Item -Path dist\assets\index*.js -Destination release\script.js
Copy-Item -Path dist\assets\index*.css -Destination release\style.css
Remove-Item -Path release\13Bubbles.zip
Compress-Archive -Path release\* -DestinationPath release\13Bubbles.zip