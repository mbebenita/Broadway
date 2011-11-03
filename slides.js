function editSource() {
  window.open("http://etherpad.mozilla.org:9000" +
              window.location.pathname);
}

onclick = function(event) {
  if (event.shiftKey)
    editSource();
};

onload = function() {
  var allSlides = document.querySelectorAll(".slide");
  var currSlide;

  function $(sel) {
   return document.querySelector(sel);
  }

  function each(sel, fun) {
    var nodeList = document.querySelectorAll(sel);
    for (var i = 0; i < nodeList.length; i++)
      fun.call(nodeList[i], i);
  }

  function removeClass(elem, className) {
    var classes = elem.className.split(" ");
    if (classes.indexOf(className) != -1) {
      classes.splice(classes.indexOf(className), 1);
      elem.className = classes.join(" ");
    }
  }

  function addClass(elem, className) {
    var classes = elem.className.split(" ");
    if (classes.indexOf(className) == -1)
      elem.className += " " + className;
  }

  function addFooters() {
    var footer = $(".title.slide .footer");
    var date = $(".title.slide .date");

    each(".normal.slide", function() {
      if (date)
        this.appendChild(date.cloneNode(true));
      if (footer)
        this.appendChild(footer.cloneNode(true));
    });

    each(".slide", function(i) {
      var slideNo = document.createElement("div");
      slideNo.className = "slide-number";
      slideNo.textContent = (i + 1) + " / " + allSlides.length;
      this.appendChild(slideNo);
    });
  }

  function setCurrSlide(newCurrSlide) {
    if (newCurrSlide != currSlide) {
      if (currSlide != undefined)
        removeClass(allSlides[currSlide - 1], "selected");
      currSlide = newCurrSlide;
      addClass(allSlides[currSlide - 1], "selected");
      if (currSlide == 1)
        window.location.hash = "";
      else
        window.location.hash = "#" + currSlide;
    }
  }

  function setCurrSlideFromHash() {
    var hash = window.location.hash;
    var match = hash.match(/#(-?[0-9]+)/);
    if (match) {
      var newSlide = parseInt(match[1]);
      if (newSlide < 0)
        newSlide = allSlides.length + newSlide;
      setCurrSlide(newSlide);
    } else
      setCurrSlide(1);
  }

  function prevSlide() {
    if (currSlide > 1)
      setCurrSlide(currSlide - 1);
  }

  function nextSlide() {
    if (currSlide < allSlides.length)
      setCurrSlide(currSlide + 1);
  }

  if ('onhashchange' in window)
    window.onhashchange = setCurrSlideFromHash;
  else
    window.setInterval(setCurrSlideFromHash, 250);

  window.onkeydown = function(event) {
    // Don't let Firefox scroll the window *and*
    // advance the slides at the same time.
    event.preventDefault();
  };

  window.onkeyup = function(event) {
    const LEFT_ARROW = 37;
    const RIGHT_ARROW = 39;
    const SPACE = 32;

    switch (event.keyCode) {
    case SPACE:
    case RIGHT_ARROW:
      nextSlide();
      break;
    case LEFT_ARROW:
      prevSlide();
      break;
    }
  };

  function setupTouchUI() {
    var startX;
    var startY;
    var x;
    var y;
    var inGesture;
    
    document.body.addEventListener("touchstart", function(event) {
      inGesture = true;
      startX = event.touches[0].pageX;
      startY = event.touches[0].pageY;
    }, false);
    
    document.body.addEventListener("touchmove", function(event) {
      if (event.touches.length == 3)
        editSource();
      if (event.touches.length > 1)
        inGesture = false;
      if (!inGesture)
        return;
      x = event.targetTouches[0].pageX - startX;
      y = event.targetTouches[0].pageY - startY;
      event.preventDefault();
    }, false);
    
    document.body.addEventListener("touchend", function(event) {
      if (!inGesture)
       return;
      if (Math.abs(x) < Math.abs(y))
        return;
      if (x < 0)
        nextSlide();
      if (x > 0)
        prevSlide();
    }, false);
  }

  setCurrSlideFromHash();
  setupTouchUI();
  addFooters();

  document.body.style.display = "block";
  document.title = $(".title.slide .header").textContent;
};
