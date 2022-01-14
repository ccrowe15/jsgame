const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.querySelector('#scoreEl');
const startGamebtn = document.querySelector('#startGamebtn')
const modal = document.querySelector('#modal')
const modalScore = document.querySelector('#modalScore');
canvas.width = innerWidth
canvas.height = innerHeight


class Player {
    constructor(x, y, radius, color) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
    }

    draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        ctx.fillStyle = this.color
        ctx.fill()
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }
    draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        ctx.fillStyle = this.color
        ctx.fill()
    }

    update() {
        this.draw()
        this.x = this.x + this.velocity.x 
        this.y = this.y + this.velocity.y 
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }
    draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        ctx.fillStyle = this.color
        ctx.fill()
    }

    update() {
        this.draw()
        this.x = this.x + this.velocity.x 
        this.y = this.y + this.velocity.y 
    }
}

class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
        this.alpha = 1
    }
    draw() {
        ctx.save()
        ctx.globalAlpha = this.alpha
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        ctx.fillStyle = this.color
        ctx.fill()
        ctx.restore()
    }

    update() {
        this.draw()
        this.velocity.x *= 0.99
        this.velocity.y *= 0.99
        this.x = this.x + this.velocity.x 
        this.y = this.y + this.velocity.y 
        this.alpha -= 0.01
    }
}

//center of frame
let x = canvas.width / 2;
let y = canvas.height / 2;

let player = new Player(x,y, 15, 'white');
let projectiles = []
let enemies = []
let particles = []
let score = 0

function init() {
    player = new Player(x,y, 15, 'white');
    projectiles = []
    enemies = []
    particles = []   
    score = 0  
    modalScore.innerHTML = score
    scoreEl.innerHTML = score
}

let timer
function spawnEnemies() {
	if (timer) {
		//console.log("stop spawning enemies")
		clearInterval(timer)
		timer = null
	}
	else {
		timer = setInterval(() => {
			const radius = Math.random() * (32 - 6) + 6
			let enmx
			let enmy
			if (Math.random() < 0.5) {
				enmx = Math.random() < 0.5 ? (0 - radius)  : canvas.width + radius
				enmy = Math.random() * canvas.height 
			}
			else {
				enmx = Math.random() * canvas.width 
				enmy = Math.random() < 0.5 ? (0 - radius)  : canvas.height + radius
			}
			//hue, saturation (how deep), lightness (how bright)
			
			const color = `hsl(${Math.random() * 360}, 50%, 50%)`

			const angle = Math.atan2(y - enmy, x - enmx)
			const velocity = {
				x: Math.cos(angle) * 0.85,
				y: Math.sin(angle) * 0.85
			}

			enemies.push(new Enemy(enmx, enmy, radius, color, velocity))
			//console.log(enemies)
		}, 1000)
	}
}

//update all particles in the game
function updateParticles() {
    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1)
        }
        else {
            particle.update()
        }
    })
}

//update all projectiles in the game
function updateProjectiles() {
    projectiles.forEach((projectile, projIndex) => {
        projectile.update()
        //clear projectile if off screen
        if (projectile.x + projectile.radius < 0 
            || projectile.x - projectile.radius > canvas.width
            || projectile.y + projectile.radius < 0 
            || projectile.y - projectile.radius > canvas.height
            ) {
            setTimeout(() => {
                projectiles.splice(projIndex, 1)
            })
        }
    })
}

//update all enemies in the game, handles collision detection on player+projectiles
function updateEnemies() {
    enemies.forEach((enemy, enmIndex) => {
        enemy.update()
        //collision detection for player and enemy
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y)
        if (dist - enemy.radius - player.radius < 1) {
            //end game if enemy hits player
            cancelAnimationFrame(animationID)
            modal.style.display = 'flex'
            modalScore.innerHTML = score
			//stop spawning enemies
			spawnEnemies()
        }

        projectiles.forEach((projectile, projIndex) => {
            //collision detection for projectile and enemy
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y)
            if (dist - enemy.radius - projectile.radius < 1) {
                //create particle effect
                for (let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(new Particle(projectile.x, projectile.y, Math.random() * 2, enemy.color, {
                        x: (Math.random() - 0.5) * (Math.random() * 5), 
                        y: (Math.random() - 0.5) * (Math.random() * 5)
                    }))
                }
                //shrink large enemies
                if (enemy.radius - 10 > 6) {
                    //increase score on hit/shrink
                    score += 100
                    scoreEl.innerHTML = score
                    gsap.to(enemy, {radius: enemy.radius -= 10})
                    setTimeout(() => {
                        projectiles.splice(projIndex, 1)
                    }, 0)
                }
                else {
                    //increase score on kill
                    score += 250
                    scoreEl.innerHTML = score
                    //kill enemy
                    setTimeout(() => {
                        enemies.splice(enmIndex, 1)
                        projectiles.splice(projIndex, 1)
                    }, 0)
                }
            }
        })
    })
}

let animationID 

//animation/game loop 
function animate() {
    animationID = requestAnimationFrame(animate)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
    ctx.fillRect(0,0,canvas.width, canvas.height)
    player.draw()
    
    updateParticles()
    updateProjectiles()
    updateEnemies()
}

//create projectile on mouseclick
addEventListener('click', (event) => {
    //event gives 
    //console.log(event)
    //to calc angle, get dist from current location to center
    const angle = Math.atan2(event.clientY - y, event.clientX - x)
    const velocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5
    }
    projectiles.push(new Projectile(x, y, 5, 'white', velocity))
})


//start new game
startGamebtn.addEventListener('click', () => {
    init()
    animate()
    modal.style.display = 'none'
	spawnEnemies()
})