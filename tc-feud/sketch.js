// var HTML_FILE_URL = './awesome.json';

// Might be used in the final version if we have a server to access the JSON from/with
// function parseJSON(HTML_FILE_URL) {
//   fetch(HTML_FILE_URL)
//     .then((res) => res.text())
//     .then((text) => {
//       json_obj = JSON.parse(text);
//       console.log(json_obj);
//     })
//     .catch((e) => console.error(e));
// };

// The page current flashes the unformatted content when loading
// ! Not sure if you know how to fix but when the page loads it says:
/* Layout was forced before the page was fully loaded. 
 * If stylesheets are not yet loaded this may cause a flash of unstyled content.
*/


/*
Plans:
Add active points to store accumulated points
  Center of the page
  Along with active team
Strike tracker
  By team name?
    Or active team?
Worth noting that the other organisers don't seem to know exactly how to play either
*/


function start() {
  // const inputJson = JSON.parse(json);
  // let quiz = new Quiz(inputJson.rounds);

  addEventListener('keydown', (event) => {
    // console.log(event.key);
    if (event.key === " ") { event.preventDefault(); updatePage(); } 
    else if (event.key == "t") {
      event.preventDefault();
      if (quiz.activeTeamIndex + 1 < quiz.teams.length) {
        console.log(quiz.activeTeamIndex);
        quiz.activeTeamIndex++
      } else {
        quiz.activeTeamIndex = 0;
      }
      drawTeams();
    }

    else if (event.key === "Enter") {
      event.preventDefault();
      quiz.givePoints(quiz.currentRound().activePoints);
      quiz.currentRound().activePoints = 0;
      drawPoints();
    }

    else if (event.key === "s") {
      event.preventDefault();
      quiz.currentRound().strikes += 1;
      quiz.currentRound().strikes %= 4;
      drawStrikes();
    }

    else if (event.key >= 0 && event.key <= 9) {
      const answer = (event.key >= 1 && event.key <= 9) ? quiz.currentRound().answers[event.key - 1] : quiz.currentRound().answers[9];
      const index = event.key > 0? event.key - 1:9;
      answer.revealed = !answer.revealed; // Confusing but fewer lines so yay
      if (answer.revealed) { // Now equivalent to !answer.revealed
        quiz.addPoints(answer.value)
        revealAnswer(index < 5? document.getElementById("left-column").children[index]:document.getElementById("right-column").children[index - 5]);
      } else {
        quiz.addPoints(-answer.value)
        drawAnswers(quiz.currentRound());
      }
    }
  })

  document.getElementById("active-team").addEventListener("click", () => {
    if (document.getElementById("manual-points")) {
      document.getElementById("manual-points").remove();
    } else {
    document.getElementById("game").insertAdjacentElement('afterend', manual_points())
    }
  })

  document.getElementById("round-title").addEventListener("click", () => {
    showMenu()
  })

  drawPage();
}

function manual_points() {
  const manual_container = document.createElement('div');
  manual_container.innerHTML = manual_points_html;
  manual_container.firstChild.addEventListener("submit", (event) => {
    event.preventDefault();
    console.log(event.target.elements[0].value)
    quiz.givePoints(Number(event.target.elements[0].value));
    event.target.reset();
  })
  manual_container.firstChild.addEventListener("keydown", (event) => event.stopPropagation())
  return manual_container.firstChild
}

// This would be equivalent to reloading the page
// We should probably try for a softer reset
function resetQuiz() {
  const inputJson = JSON.parse(json);
  quiz = new Quiz(inputJson.rounds);
}

function showMenu() {
  const menuDiv = document.createElement("div");
  menuDiv.id = "menu" // Gonna need some styling
  menuDiv.replaceChildren(...menuItems());
  document.getElementById("game").insertAdjacentElement("afterend", menuDiv);
}

function menuItems() {
  const menuItems = [];
  for (const round of quiz.rounds) {
    const optionDiv = document.createElement("div");
    optionDiv.classList.add("menu-item");
    optionDiv.innerHTML = menuItemHtml(round);
    optionDiv.addEventListener("click", () => {
      quiz.currentRoundIndex = quiz.rounds.indexOf(round);
      drawPage();
      document.getElementById("menu").remove();
    });
    menuItems.push(optionDiv);
  }
  return menuItems
}

function menuItemHtml(round) {
  return `${round.name}`
}

function updatePage() {
  // Currently just have the rounds looping, 
  // This code is *mostly* for testing
  if (quiz.currentRoundIndex < 5) {
    quiz.currentRoundIndex += 1;
  }

  drawPage();
};

// Reveal an answer and point value from the number of the answer
function revealAnswer(element) {
  animateReveal(element);
};

function animateReveal(element) {
  element.classList.add("uncovered");
};

// function menu() {
//   quiz.rounds.forEach((round) => {
//     roundDiv = document.createElement("div")
//     roundDiv.innerHTML(`<h1>${round.name}</h1>`)
//     roundDiv.addEventListener("click", (event) => {
      
//     })
//     document.getElementById("menu").
//   })
// }

/*
* Draw the quiz page based on the current global state
* rather than having all functions change the page directly;
* this keeps all the site changing code in one place
*/

function drawPage() {  
  let round = quiz.currentRound();
  // --------- Updating title and question ---------
  {
    let question = document.getElementById("question");
    let round_title = document.getElementById("round-title"); // The <h1> element

    round_title.innerHTML = `${round.name}:`;
    question.innerText = round.question;
  }

  // --------- Updating answers ---------
  drawAnswers(round);
  // --------- Updating points ---------
  drawPoints();
  // --------- Updating active team ---------
  drawTeams();
};

function drawAnswers(round) {
  const cards = round.answers.map(
    (answer, index) => {
      return createCard(answer, index);
    }
  );

  const leftColumn = document.getElementById("left-column");
  const rightColumn = document.getElementById("right-column");
  
  let middle = Math.ceil(cards.length / 2);
  // console.log()
  leftColumn.replaceChildren(...cards.slice(0, middle));
  rightColumn.replaceChildren(...cards.slice(middle));

  fitText()
}

function fitText() {
  // Loop through cards, and resize elements with an appropriate transform
  const leftColumn = document.getElementById("left-column");
  const rightColumn = document.getElementById("right-column");

  for (let card of leftColumn.children) {
    fitCard(card);
  }
  for (let card of rightColumn.children) {
    fitCard(card);
  }
}

function fitCard(card) {
  const padding = 35;
  let content = card.firstElementChild;
  let answer = content.firstElementChild;
  let answer_points = content.lastElementChild;

  const available_room = content.offsetWidth - answer_points.offsetWidth - padding;
  // change width of answer div
  // scaleX of <p>
  if (answer.offsetWidth > available_room) {
    let text = answer.firstElementChild;

    squeeze_ratio = available_room / answer.offsetWidth;

    answer.style.width = `${squeeze_ratio * 100}%`;
    text.style.transform = `scaleX(${squeeze_ratio})`;
  }
}

function drawTeams() {
  const activeTeamDiv = document.getElementById("active-team");
  activeTeamDiv.innerHTML = `${quiz.teams[quiz.activeTeamIndex].name}`;
  if (quiz.activeTeamIndex === 0) {
    activeTeamDiv.classList.remove("team2");
    activeTeamDiv.classList.add("team1");
  } else {
    activeTeamDiv.classList.remove("team1");
    activeTeamDiv.classList.add("team2");
  }
}

function drawPoints() {
  document.getElementById("active-points").innerHTML = `Points: ${quiz.currentRound().activePoints}`
  document.getElementById("team1").innerHTML = pointText(quiz.team1());
  document.getElementById("team2").innerHTML = pointText(quiz.team2());
}

function drawStrikes() {
  const div = document.getElementById("strikes");
  console.log(quiz.currentRound().strikes)
  div.innerHTML = strikeHtml().repeat(quiz.currentRound().strikes);
  div.getAnimations().forEach(animation => {
    animation.cancel();
    animation.play();    
  });
}

function strikeHtml() {
  return `<img class="strike" src="images/strike.webp" alt="X" />`
}

function createCard(answer, index) {
  // Creates card div
  const htmlParser = new DOMParser();
  const answerDiv = htmlParser.parseFromString(
    card_template(answer, index),
    'text/html'
  ).firstChild.lastChild.firstChild;

  answerDiv.addEventListener( "click", (_) => {
    answer.revealed = !answer.revealed; // Confusing but fewer lines so yay
    if (answer.revealed) { // Now equivalent to !answer.revealed
      quiz.addPoints(answer.value)
      revealAnswer(answerDiv);
    } else {
      quiz.addPoints(-answer.value)
      drawAnswers(quiz.currentRound());
    }
  });

  return answerDiv;
};

// Could make this if we have a page listing all the rounds 
// to give the quizmaster agency in choosing which round
// without having to spam next or similar
// Would change the page back to the round selection page
function homePage() {};

// Gotta have a page for when it's finished
// and a button to finish
function finish() {};

const points = [50, 40, 30, 20, 15, 10, 8, 6, 4, 2]

// Class for the one quiz object we will ever initialise
class Quiz {
  constructor(rounds) {
    this.rounds = rounds.map(round => (
      {
        name: round.name,
        activePoints: 0,
        strikes: 0,
        question: round.question,
        answers: round.answers.map(answer => ({
          content: answer.content,
          value: points[round.answers.indexOf(answer)],
          revealed: false, // All answers are hidden by default
        }))
      }
    ));
    this.currentRoundIndex = 0;
    this.teams = [
      {name: "Team 1", points: 0},
      {name: "Team 2", points: 0},
    ]
    this.activeTeamIndex = 0;
  }

  // Methods!
  * iterRoundAnswers() {
    let index = 0;
    const answers = this.rounds[this.currentRoundIndex].answers;

    while (index < answers.length){
      yield [answers[index], index++, answers.revealed];
    }
  }

  currentRound() { 
    return this.rounds[this.currentRoundIndex]
  }
  
  team1() {
    return this.teams[0]
  }

  team2() {
    return this.teams[1]
  }

  addPoints(points) {
    this.currentRound().activePoints += points;
    drawPoints();
  }

  givePoints(points) {
    this.teams[this.activeTeamIndex].points += points;
    drawPoints();
  }
};

// CORS policy prevents accessing the JSON file without running a server
// Error: "index.html:1  Access to fetch at 'file://wsl%24/Ubuntu-20.04/home/ewan/git/tc-feud/awesome.json' from origin 'null' has been blocked by CORS policy: Cross origin requests are only supported for protocol schemes: http, data, isolated-app, chrome-extension, chrome-untrusted, https, edge."
// So this will be easier for developing
const json = `{
  "rounds": [
      {
          "name" :"Round 1",
          "question" : "What would a student buy from the canteen?",
          "answers": [
              { "value" : 25, "content" : "Pies" },
              { "value" : 75, "content" : "Cookies" },
              { "value" : 25, "content" : "Noodles" },
              { "value" : 25, "content" : "Brownies" },
              { "value" : 25, "content" : "Hot dogs" },
              { "value" : 25, "content" : "Sausage rolls" },
              { "value" : 25, "content" : "Zombie chews" },
              { "value" : 25, "content" : "Fruit burst" },
              { "value" : 25, "content" : "Nachos" },
              { "value" : 25, "content" : "Chips" }
          ]
      },

      {
          "name" : "Round 2",
          "question" : "What is the most common excuse that students give for being late to class?",
          "answers": [
              { "value" : 99, "content" : "Slept in" },
              { "value" : 1, "content" : "Traffic" },
              { "value" : 99, "content" : "Public transport problems" },
              { "value" : 99, "content" : "Didn’t hear the bell" },
              { "value" : 99, "content" : "Had to walk to school" },
              { "value" : 99, "content" : "Appointment" },
              { "value" : 99, "content" : "Siblings fault" },
              { "value" : 99, "content" : "Extracurricular Activities" },
              { "value" : 99, "content" : "Forgot something and had to go back for it" },
              { "value" : 99, "content" : "Medical emergency" }
          ]
      },

      {
          "name" : "Round 3",
          "question" : "What is the most famous superhero according to the students?",
          "answers": [
              { "value" : 1, "content" : "Spiderman" },
              { "value" : 1, "content" : "Superman" },
              { "value" : 1, "content" : "Batman" },
              { "value" : 1, "content" : "Iron man" },
              { "value" : 1, "content" : "Black Panther" },
              { "value" : 1, "content" : "Groot" },
              { "value" : 1, "content" : "Doctor Strange" },
              { "value" : 1, "content" : "Thor" },
              { "value" : 1, "content" : "Captain marvel" },
              { "value" : 1, "content" : "Rocket Racoon" }
          ]
      },

      {
          "name" : "Round 4",
          "question" : "What are TC student's favourite subjects?",
          "answers": [
              { "value" : 1, "content" : "Foods" },
              { "value" : 1, "content" : "P.E" },
              { "value" : 1, "content" : "Science" },
              { "value" : 1, "content" : "Maths" },
              { "value" : 1, "content" : "English" },
              { "value" : 1, "content" : "Art" },
              { "value" : 1, "content" : "Media Studies" },
              { "value" : 1, "content" : "Social Studies" },
              { "value" : 1, "content" : "Japanese" },
              { "value" : 1, "content" : "Health" }
          ]
      },

      {
          "name" : "Round 5",
          "question" : "Which staff member can be found at the canteen the most?",
          "answers": [
              { "value" : 1, "content" : "Mr Clarke" },
              { "value" : 1, "content" : "Mr Pivac" },
              { "value" : 1, "content" : "Mr Greenwood-boot" },
              { "value" : 1, "content" : "Mrs Eames" },
              { "value" : 1, "content" : "Mr Casbolt" },
              { "value" : 1, "content" : "Mr Salter" },
              { "value" : 1, "content" : "Mr Conroy" },
              { "value" : 1, "content" : "Mr Davies" },
              { "value" : 1, "content" : "Ms Boyd" },
              { "value" : 1, "content" : "Mr Bibby" }
          ]
      },

      {
          "name" : "Round 6",
          "question" : "Which staff member would most likely survive a Zombie Apocalypse?",
          "answers": [
              { "value" : 1, "content" : "Mrs Eames" },
              { "value" : 1, "content" : "Mr Bibby" },
              { "value" : 1, "content" : "Mr Burke" },
              { "value" : 1, "content" : "Mr Clarke" },
              { "value" : 1, "content" : "Mr Pivac" },
              { "value" : 1, "content" : "Mr Casbolt" },
              { "value" : 1, "content" : "Pare" },
              { "value" : 1, "content" : "Mr Savage" },
              { "value" : 1, "content" : "Ms McCreight" },
              { "value" : 1, "content" : "Mr Harris" }
          ]
      }
  ]
  
}`

const quiz = new Quiz(JSON.parse(json).rounds); // Globalised!

// This was initially a variable hence the odd function notation
const card_template = (ans, index) => {
  uncovered = ans.revealed ? ' uncovered' : ''
  return `<div class="card${uncovered}">
  <div class="content">
    <div class = "answer"> 
      <p>${ans.content}</p>
    </div>
    <div class = "answer_points">
      <p>${ans.value}</p>
    </div>
  </div>
  

  <div class="cover">
    <div class="cover_number"><h2>${index + 1}</h2></div>
  </div>
</div>`
}

function pointText(team) {
  return `${team.name}: ${team.points} points`
}

const manual_points_html = `<form id="manual-points" method="get">
<label for="field">Add points to the active team</label>
<input type="number" id="text-field" name="field">
<input type="submit" value="Add">
</form>`