const width = window.innerWidth;
        const height = window.innerHeight;

        // Create Konva Stage and Layer
        const stage = new Konva.Stage({
            container: 'container',
            width: width,
            height: height,
        });

        const layer = new Konva.Layer();
        stage.add(layer);

        // Variables
        let castle;
        let spawnEnemyInterval = null;
        let spawnPowerUpInterval = null;
        let gamePaused = false;
        let castleHealth = 10;
        let score = 0;

        // Load Images
        const imageObj = new Image();
        imageObj.src = 'castle.jpg'; // Ensure correct path

        const knightImage = new Image();
        knightImage.src = 'knight.png'; // Ensure correct path

        let knightImageLoaded = false;
        knightImage.onload = () => {
            knightImageLoaded = true;
        };

        imageObj.onload = () => {
            castle = new Konva.Image({
                x: width / 2 - 50,
                y: height / 2 - 50,
                image: imageObj,
                width: 100,
                height: 100,
            });
            layer.add(castle);
            layer.draw();
        };

        // Player Setup (Archer)
        const player = new Konva.Rect({
            x: width / 2 - 20,
            y: height - 60,
            width: 40,
            height: 40,
            fill: '#228b22', // Green archer
            cornerRadius: 5,
        });
        layer.add(player);

        // Arrays
        const arrows = [];
        const enemies = [];
        const powerUps = [];

        // Player Movement
        let keysPressed = {};
        window.addEventListener('keydown', (e) => {
            keysPressed[e.key] = true;
        });
        window.addEventListener('keyup', (e) => {
            keysPressed[e.key] = false;
        });

        function movePlayer() {
            const speed = 5;
            if (keysPressed['ArrowLeft'] && player.x() > 0) {
                player.x(player.x() - speed);
            }
            if (keysPressed['ArrowRight'] && player.x() < width - player.width()) {
                player.x(player.x() + speed);
            }
        }

        // Shoot Arrows
        window.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                shootArrow();
            }
        });

        function shootArrow() {
            const arrow = new Konva.Line({
                points: [
                    player.x() + player.width() / 2,
                    player.y(),
                    player.x() + player.width() / 2,
                    player.y() - 20
                ],
                stroke: '#ffcc00', // Yellow arrow
                strokeWidth: 5,
            });
            arrows.push(arrow);
            layer.add(arrow);
        }

        // Spawn Enemies (using knight image)
        function spawnEnemy() {
            if (gamePaused || !knightImageLoaded) return;
            const enemy = new Konva.Image({
                x: Math.random() * width,
                y: 0,
                image: knightImage,
                width: 64,   // adjust as needed
                height: 64,  // adjust as needed
            });
            enemies.push(enemy);
            layer.add(enemy);
        }

        // Spawn Power-ups (Castle Health Boost)
        function spawnPowerUp() {
            if (gamePaused) return;
            const powerUp = new Konva.Rect({
                x: Math.random() * width,
                y: Math.random() * (height / 2),
                width: 30,
                height: 30,
                fill: '#00ff00', // Green power-up for health boost
                cornerRadius: 5,
            });
            powerUps.push(powerUp);
            layer.add(powerUp);
        }

        // Game Loop
        function gameLoop() {
            if (!gamePaused) {
                movePlayer();
                moveArrows();
                moveEnemies();
                movePowerUps();
                checkCollisions();
                checkCastleCollision();
                checkPowerUpCollision();
                layer.draw();
            }
            requestAnimationFrame(gameLoop);
        }

        // Move Arrows Upward
        function moveArrows() {
            arrows.forEach((arrow, index) => {
                const points = arrow.points();
                const speed = 10;
                points[1] -= speed;
                points[3] -= speed;
                arrow.points(points);

                if (points[1] < 0) {
                    arrow.destroy();
                    arrows.splice(index, 1);
                }
            });
        }

        // Move Enemies Toward Castle
        function moveEnemies() {
            enemies.forEach((enemy, enemyIndex) => {
                if (!castle) return; // Wait until castle is loaded
                const angle = Math.atan2(
                    castle.y() + castle.height() / 2 - (enemy.y() + enemy.height()/2),
                    castle.x() + castle.width() / 2 - (enemy.x() + enemy.width()/2)
                );
                const speed = 2;
                enemy.x(enemy.x() + Math.cos(angle) * speed);
                enemy.y(enemy.y() + Math.sin(angle) * speed);

                // Remove enemy if it goes out of bounds
                if (enemy.y() > height || enemy.x() < 0 || enemy.x() > width) {
                    enemy.destroy();
                    enemies.splice(enemyIndex, 1);
                }
            });
        }

        // Move Power-ups Downward
        function movePowerUps() {
            powerUps.forEach((powerUp, index) => {
                const speed = 1;
                powerUp.y(powerUp.y() + speed);

                // If power-up goes off the bottom of the screen, remove it
                if (powerUp.y() > height) {
                    powerUp.destroy();
                    powerUps.splice(index, 1);
                }
            });
        }

        // Check Collisions (Arrow and Enemy)
        function checkCollisions() {
            arrows.forEach((arrow, arrowIndex) => {
                enemies.forEach((enemy, enemyIndex) => {
                    // Approximate collision using center points
                    const enemyX = enemy.x() + enemy.width() / 2;
                    const enemyY = enemy.y() + enemy.height() / 2;
                    const dx = arrow.points()[0] - enemyX;
                    const dy = arrow.points()[1] - enemyY;
                    const distance = Math.sqrt(dx*dx + dy*dy);

                    const collisionThreshold = 20; // Adjust as needed
                    if (distance < collisionThreshold) {
                        arrow.destroy();
                        enemy.destroy();
                        arrows.splice(arrowIndex, 1);
                        enemies.splice(enemyIndex, 1);
                        score += 10;
                        updateHealthDisplay();
                    }
                });
            });
        }

        // Check Castle Collision with Enemies
        function checkCastleCollision() {
            if (!castle) return;
            enemies.forEach((enemy, enemyIndex) => {
                const castleCenterX = castle.x() + castle.width() / 2;
                const castleCenterY = castle.y() + castle.height() / 2;
                const enemyCenterX = enemy.x() + enemy.width() / 2;
                const enemyCenterY = enemy.y() + enemy.height() / 2;

                const dx = castleCenterX - enemyCenterX;
                const dy = castleCenterY - enemyCenterY;
                const distance = Math.sqrt(dx*dx + dy*dy);

                // Adjust threshold as needed
                const collisionThreshold = (castle.width() / 2) + 20;
                if (distance < collisionThreshold) {
                    castleHealth -= 1;
                    enemy.destroy();
                    enemies.splice(enemyIndex, 1);
                    updateHealthDisplay();

                    if (castleHealth <= 0) {
                        alert('Game Over! The castle has fallen. Your score: ' + score);
                        window.location.reload();
                    }
                }
            });
        }

        // Check Collision with Power-ups (Castle Health Boost)
        function checkPowerUpCollision() {
            powerUps.forEach((powerUp, powerUpIndex) => {
                const playerCenterX = player.x() + player.width() / 2;
                const playerCenterY = player.y() + player.height() / 2;
                const powerUpCenterX = powerUp.x() + powerUp.width() / 2;
                const powerUpCenterY = powerUp.y() + powerUp.height() / 2;

                const dx = playerCenterX - powerUpCenterX;
                const dy = playerCenterY - powerUpCenterY;
                const distance = Math.sqrt(dx*dx + dy*dy);

                if (distance < (player.width() / 2 + powerUp.width() / 2)) {
                    powerUp.destroy();
                    powerUps.splice(powerUpIndex, 1);
                    activateHealthBoost();
                }
            });
        }

        // Activate Health Boost Power-up
        function activateHealthBoost() {
            castleHealth = Math.min(castleHealth + 2, 10); // Increase castle health, max of 10
            updateHealthDisplay();
        }

        // Health and Score Display
        const healthDisplay = document.createElement('div');
        healthDisplay.style.position = 'absolute';
        healthDisplay.style.top = '10px';
        healthDisplay.style.left = '10px';
        healthDisplay.style.color = '#fff';
        healthDisplay.style.fontSize = '20px';
        document.body.appendChild(healthDisplay);

        function updateHealthDisplay() {
            healthDisplay.innerText = `Castle Health: ${castleHealth} | Score: ${score}`;
        }
        updateHealthDisplay();

        // Pause and Reset Buttons
        const pauseButton = document.getElementById('pause-button');
        const resetButton = document.getElementById('reset-button');

        pauseButton.addEventListener('click', () => {
            gamePaused = !gamePaused;
            if (gamePaused) {
                pauseButton.innerText = 'Resume Game';
                clearIntervals(); // Stop spawning new enemies/power-ups
            } else {
                pauseButton.innerText = 'Pause Game';
                setIntervals(); // Resume spawning
            }
        });

        resetButton.addEventListener('click', () => {
            window.location.reload(); // Reload the page
        });

        function clearIntervals() {
            if (spawnEnemyInterval) clearInterval(spawnEnemyInterval);
            if (spawnPowerUpInterval) clearInterval(spawnPowerUpInterval);
            spawnEnemyInterval = null;
            spawnPowerUpInterval = null;
        }

        function setIntervals() {
            spawnEnemyInterval = setInterval(spawnEnemy, 3000);
            spawnPowerUpInterval = setInterval(spawnPowerUp, 10000);
        }

        // Start Button Logic
        const startButton = document.getElementById('start-button');
        startButton.addEventListener('click', () => {
            document.getElementById('title-screen').style.display = 'none';
            document.getElementById('container').style.display = 'block';
            pauseButton.style.display = 'block';
            resetButton.style.display = 'block';

            setIntervals();
            requestAnimationFrame(gameLoop); // Start game loop
        });