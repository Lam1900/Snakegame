document.addEventListener('DOMContentLoaded', () => {
    // 获取Canvas元素和上下文
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // 游戏配置
    const gridSize = 20; // 网格大小
    const tileCount = canvas.width / gridSize; // 网格数量
    let speed = 7; // 游戏速度
    
    // 速度配置
    const speedLevels = {
        1: 5,  // 新手 (慢速)
        2: 7,  // 普通
        3: 10  // 高手 (快速)
    };
    
    // 蛇的初始位置和速度
    let snake = [
        {x: 10, y: 10} // 蛇头位置
    ];
    let velocityX = 0;
    let velocityY = 0;
    
    // 食物位置
    let foodX;
    let foodY;
    
    // 游戏状态
    let gameStarted = false;
    let gameOver = false;
    
    // 分数
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    
    // 更新分数显示
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('highScore');
    highScoreElement.textContent = highScore;
    
    // 按钮和控制元素
    const startBtn = document.getElementById('startBtn');
    const restartBtn = document.getElementById('restartBtn');
    const speedLevelSelect = document.getElementById('speedLevel');
    
    // 初始化游戏
    function initGame() {
        snake = [{x: 10, y: 10}];
        velocityX = 0;
        velocityY = 0;
        score = 0;
        scoreElement.textContent = score;
        gameOver = false;
        
        // 设置初始速度
        updateSpeed();
        
        placeFood();
        drawGame();
    }
    
    // 更新游戏速度
    function updateSpeed() {
        const selectedLevel = speedLevelSelect.value;
        speed = speedLevels[selectedLevel];
    }
    
    // 随机放置食物
    function placeFood() {
        // 生成随机位置
        foodX = Math.floor(Math.random() * tileCount);
        foodY = Math.floor(Math.random() * tileCount);
        
        // 确保食物不会出现在蛇身上
        for (let i = 0; i < snake.length; i++) {
            if (snake[i].x === foodX && snake[i].y === foodY) {
                placeFood(); // 如果食物出现在蛇身上，重新放置
                return;
            }
        }
    }
    
    // 游戏主循环
    function drawGame() {
        if (gameStarted && !gameOver) {
            setTimeout(drawGame, 1000 / speed);
        }
        
        // 移动蛇
        moveSnake();
        
        // 检查游戏是否结束
        if (checkGameOver()) {
            return;
        }
        
        // 清空画布
        ctx.fillStyle = 'rgba(44, 62, 80, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制网格线
        ctx.strokeStyle = 'rgba(26, 42, 108, 0.05)';
        ctx.lineWidth = 0.5;
        
        for (let i = 0; i <= tileCount; i++) {
            // 垂直线
            ctx.beginPath();
            ctx.moveTo(i * gridSize, 0);
            ctx.lineTo(i * gridSize, canvas.height);
            ctx.stroke();
            
            // 水平线
            ctx.beginPath();
            ctx.moveTo(0, i * gridSize);
            ctx.lineTo(canvas.width, i * gridSize);
            ctx.stroke();
        }
        
        // 绘制食物
        const foodRadius = gridSize / 2;
        ctx.beginPath();
        ctx.arc(
            foodX * gridSize + foodRadius,
            foodY * gridSize + foodRadius,
            foodRadius - 2,
            0,
            Math.PI * 2
        );
        
        // 创建食物渐变
        const foodGradient = ctx.createRadialGradient(
            foodX * gridSize + foodRadius - 2,
            foodY * gridSize + foodRadius - 2,
            1,
            foodX * gridSize + foodRadius,
            foodY * gridSize + foodRadius,
            foodRadius
        );
        foodGradient.addColorStop(0, '#fdbb2d');
        foodGradient.addColorStop(1, '#b21f1f');
        
        ctx.fillStyle = foodGradient;
        ctx.fill();
        ctx.strokeStyle = 'rgba(178, 31, 31, 0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 绘制蛇
        for (let i = 0; i < snake.length; i++) {
            const segmentSize = gridSize - 2;
            const x = snake[i].x * gridSize + 1;
            const y = snake[i].y * gridSize + 1;
            
            // 为蛇身创建渐变
            const isHead = i === 0;
            const segmentGradient = ctx.createLinearGradient(x, y, x + segmentSize, y + segmentSize);
            
            if (isHead) {
                // 蛇头渐变
                segmentGradient.addColorStop(0, '#1a2a6c');
                segmentGradient.addColorStop(1, '#4361ee');
            } else {
                // 蛇身渐变 - 根据位置略微变化颜色
                const colorPos = i / snake.length;
                segmentGradient.addColorStop(0, `rgba(26, 42, 108, ${0.8 - colorPos * 0.3})`);
                segmentGradient.addColorStop(1, `rgba(67, 97, 238, ${0.9 - colorPos * 0.3})`);
            }
            
            ctx.fillStyle = segmentGradient;
            
            // 绘制圆角矩形
            const radius = isHead ? 8 : 6;
            roundRect(ctx, x, y, segmentSize, segmentSize, radius);
            
            // 为蛇头添加眼睛
            if (isHead) {
                // 确定眼睛位置基于移动方向
                let eyeX1, eyeY1, eyeX2, eyeY2;
                const eyeOffset = 4;
                const eyeRadius = 2;
                
                if (velocityX === 1) { // 向右
                    eyeX1 = x + segmentSize - eyeOffset;
                    eyeY1 = y + eyeOffset;
                    eyeX2 = x + segmentSize - eyeOffset;
                    eyeY2 = y + segmentSize - eyeOffset;
                } else if (velocityX === -1) { // 向左
                    eyeX1 = x + eyeOffset;
                    eyeY1 = y + eyeOffset;
                    eyeX2 = x + eyeOffset;
                    eyeY2 = y + segmentSize - eyeOffset;
                } else if (velocityY === 1) { // 向下
                    eyeX1 = x + eyeOffset;
                    eyeY1 = y + segmentSize - eyeOffset;
                    eyeX2 = x + segmentSize - eyeOffset;
                    eyeY2 = y + segmentSize - eyeOffset;
                } else { // 向上或静止
                    eyeX1 = x + eyeOffset;
                    eyeY1 = y + eyeOffset;
                    eyeX2 = x + segmentSize - eyeOffset;
                    eyeY2 = y + eyeOffset;
                }
                
                // 绘制眼睛
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(eyeX1, eyeY1, eyeRadius, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(eyeX2, eyeY2, eyeRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // 辅助函数：绘制圆角矩形
        function roundRect(ctx, x, y, width, height, radius) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();
        }
        
        // 检查是否吃到食物
        if (snake[0].x === foodX && snake[0].y === foodY) {
            // 增加蛇的长度
            snake.push({x: snake[snake.length - 1].x, y: snake[snake.length - 1].y});
            // 放置新的食物
            placeFood();
            // 增加分数
            score++;
            scoreElement.textContent = score;
            
            // 添加分数更新动画
            scoreElement.classList.add('updated');
            setTimeout(() => {
                scoreElement.classList.remove('updated');
            }, 500);
            
            // 更新最高分
            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem('snakeHighScore', highScore);
                
                // 添加最高分更新动画
                highScoreElement.classList.add('updated');
                setTimeout(() => {
                    highScoreElement.classList.remove('updated');
                }, 500);
            }
            
            // 每得5分增加速度，但不超过当前难度级别的最大速度
            if (score % 5 === 0) {
                const selectedLevel = speedLevelSelect.value;
                const maxSpeedForLevel = speedLevels[selectedLevel] + 3; // 每个级别最多增加3点速度
                if (speed < maxSpeedForLevel) {
                    speed += 1;
                }
            }
        }
    }
    
    // 移动蛇
    function moveSnake() {
        if (velocityX === 0 && velocityY === 0) return;
        
        // 创建新的蛇头
        const head = {x: snake[0].x + velocityX, y: snake[0].y + velocityY};
        
        // 将新的蛇头添加到蛇身前面
        snake.unshift(head);
        
        // 如果没有吃到食物，移除蛇尾
        if (!(head.x === foodX && head.y === foodY)) {
            snake.pop();
        }
    }
    
    // 检查游戏是否结束
    function checkGameOver() {
        if (!gameStarted) return false;
        
        // 检查是否撞墙
        if (snake[0].x < 0 || snake[0].x >= tileCount || snake[0].y < 0 || snake[0].y >= tileCount) {
            gameOver = true;
        }
        
        // 检查是否撞到自己
        for (let i = 1; i < snake.length; i++) {
            if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
                gameOver = true;
                break;
            }
        }
        
        if (gameOver) {
            // 创建半透明渐变背景
            const gameOverGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gameOverGradient.addColorStop(0, 'rgba(26, 42, 108, 0.8)');
            gameOverGradient.addColorStop(1, 'rgba(178, 31, 31, 0.8)');
            ctx.fillStyle = gameOverGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // 绘制游戏结束文本
            ctx.fillStyle = 'white';
            ctx.font = '700 32px Poppins';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // 添加文本阴影
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            ctx.fillText('游戏结束!', canvas.width / 2, canvas.height / 2 - 30);
            
            // 重置阴影
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            ctx.font = '600 22px Poppins';
            ctx.fillText(`最终得分: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
            
            // 绘制重新开始提示
            ctx.font = '400 16px Poppins';
            ctx.fillText('点击"重新开始"按钮再玩一次', canvas.width / 2, canvas.height / 2 + 60);
            
            // 重置阴影
            ctx.shadowColor = 'transparent';
            
            startBtn.disabled = true;
            restartBtn.disabled = false;
            gameStarted = false;
            return true;
        }
        
        return false;
    }
    
    // 键盘控制
    document.addEventListener('keydown', (event) => {
        if (!gameStarted) return;
        
        // 防止按相反方向键导致立即死亡
        switch (event.key) {
            case 'ArrowUp':
                if (velocityY !== 1) { // 不允许向下时向上
                    velocityX = 0;
                    velocityY = -1;
                }
                break;
            case 'ArrowDown':
                if (velocityY !== -1) { // 不允许向上时向下
                    velocityX = 0;
                    velocityY = 1;
                }
                break;
            case 'ArrowLeft':
                if (velocityX !== 1) { // 不允许向右时向左
                    velocityX = -1;
                    velocityY = 0;
                }
                break;
            case 'ArrowRight':
                if (velocityX !== -1) { // 不允许向左时向右
                    velocityX = 1;
                    velocityY = 0;
                }
                break;
        }
    });
    
    // 开始游戏按钮
    startBtn.addEventListener('click', () => {
        if (!gameStarted && !gameOver) {
            gameStarted = true;
            startBtn.disabled = true;
            restartBtn.disabled = false;
            speedLevelSelect.disabled = true; // 游戏开始后禁用速度选择
            // 初始向右移动
            velocityX = 1;
            velocityY = 0;
            
            // 添加游戏开始动画
            canvas.style.animation = 'pulse 0.5s ease';
            setTimeout(() => {
                canvas.style.animation = '';
            }, 500);
            
            drawGame();
        }
    });
    
    // 重新开始按钮
    restartBtn.addEventListener('click', () => {
        initGame();
        startBtn.disabled = false;
        restartBtn.disabled = true;
        speedLevelSelect.disabled = false; // 重新开始后启用速度选择
    });
    
    // 速度选择器变化事件
    speedLevelSelect.addEventListener('change', updateSpeed);
    
    // 初始化游戏
    initGame();
    restartBtn.disabled = true;
});