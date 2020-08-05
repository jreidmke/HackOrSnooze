//All student created functions are commented. Starts on line 228.

$(async function() {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $myFavorites = $('#favorited-articles')
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $loggedInNav = $("#loggedInNav");


  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;
  await checkIfLoggedIn();

     //EVENT HANDLERS
  $('#nav-submit').on('click', showSubmitForm);
  $("#submitStoryBtn").on('click', submitStory);
  $("#nav-favorites").on('click', showFavoritesList);
  $allStoriesList.on('click', 'i', toggleFavorite);
  $("#nav-my-stories").on('click', showMyStoriesList);
  $ownStories.on('click', '#garbage', deleteOwnStory)
  $myFavorites.on('click', 'i', updateFavoritesPage);

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function() {
    await generateStories();
    $allStoriesList.removeClass('hidden');
    $myFavorites.addClass('hidden');
    $ownStories.addClass('hidden');
    highlightFavorites();
  });

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
      const favoritesId = currentUser.favorites.map(s => {
        return s.storyId;
      });
      highlightFavorites();
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();

    // update the navigation bar
    showNavForLoggedInUser();
    highlightFavorites();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();
    // loop through all of our stories and generate HTML for them


    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);
    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">

      <i class="far fa-star" aria-hidden="true" id="star"></i>

      <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);
    return storyMarkup;
  }

  function showNavForLoggedInUser() {
    $loggedInNav.removeClass('hidden');
    $navLogin.hide();
    $navLogOut.show();
    $("#profile-name").text(`Name: ${currentUser.name}`);
    $("#profile-username").text(`Username: ${currentUser.username}`);
    $("#profile-account-date").text(`Account Created: ${currentUser.createdAt}`)
  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }

  //STUDENT COMMENTS BEGIN
  //Submit Story Functions
  //This first function toggles the Submit Story forms appearence on the page
  function showSubmitForm() {
    $('#submit-form').hasClass('hidden') === true ? $("#submit-form").removeClass('hidden') : $('#submit-form').addClass('hidden');
  }

  //This function works in tandem with an api-class function named addStory() which submits a new story to the server. This function also updates the DOM with the new story.
  async function submitStory(e) {
    e.preventDefault();
    const $story = { //Story object is created to pass into api-class addStory()
      author: $("#author").val(),
      title: $('#title').val(),
      url: $('#url').val()
    }
    $('#submit-form').addClass('hidden'); //Hide the submit form
    await storyList.addStory(currentUser, $story); //Story is added to server
    await generateStories(); //Function checks storylist and adds new story to top of page
    highlightFavorites(); //Favorite highlights are updated
    clearInputs(); //New Story inputs are cleared.
  }

  //Favorite Stories Functions
  //This function creates then shows the favorites list on the page.
  function showFavoritesList(e) {
    $myFavorites.toggleClass('hidden');
    $ownStories.addClass('hidden')
    const faves = currentUser.favorites;
    if(faves.length < 1) { //If no favorites are in current user's array, this txt is displayed.
      $myFavorites.text("Nothing Here");
    } else {
      for(fave of faves){ //Iterates over array of user favorites
        const faveList = generateStoryHTML(fave); //creates HTML for each favorite story and stores it in a variable in faveList.
        $myFavorites.append(faveList); //Appends this list to the favorites list page
        highlightFavorites(); //Highlights the stars attached to each favorite
      }
    }
    if($myFavorites.hasClass('hidden')) { //Empties out the page whenever page is closed
      $myFavorites.empty();
    }
    $myFavorites.hasClass('hidden') !== true ? $allStoriesList.addClass('hidden') : $allStoriesList.removeClass('hidden'); //Hides allStories list when favorites page si open.

  }


  async function toggleFavorite(e) { //This function allows user to add and remove favorites to their page and accounts. It works in tandem with two api-class funcs, addFavorite() and removeFavorite()
    const $storyId = $(e.target).closest('li').attr('id'); //Store story id number in variable.
    if(!$(e.target).hasClass('fa')) { //Checks if star is not favorited.
      $(e.target).addClass('fa'); //Marks story as favorited on page.
      await currentUser.addFavorite($storyId); //Adds story to user favorite array.
    } else {
      $(e.target).removeClass('fa'); //Removes an unfavorited story from page.
      await currentUser.removeFavorite($storyId); //Removes story from user favorite array.
    }
  }

  async function updateFavoritesPage(e) { //This function updates the favorites page everytime a favorite is marked/unmarked on favorites page.
    $(e.target).toggleClass('fa');
    const story = e.target.closest('li');
    await currentUser.removeFavorite(story.id);
    story.remove();
    await generateStories();
  }

  //My Stories Functions
  function showMyStoriesList(e) { //This function creates and shows the my stories list. It works in an identical way to the showFavorites() list does and could probably be abstracted into one single function by a better coder.
    $ownStories.toggleClass('hidden');
    $myFavorites.addClass('hidden');
    const ownStories = currentUser.ownStories;
    if(ownStories.length < 1) {
      $ownStories.text((`You haven't submitted any stories yet!`));
    }
     else {
      for(story of ownStories){
        const $ownStoryLi = $(`
        <li id="${story.storyId}">
        <i class="fa fa-trash" aria-hidden="true" id="garbage"></i>

            <a class="article-link" href="${story.url}" target="a_blank">
              <strong>${story.title}</strong>
            </a>

            <small class="article-author">by ${story.author}</small>
            <small class="article-username">posted by ${story.username}</small>
        </li>
        `);
        $ownStories.append($ownStoryLi);
      }
    }
    if($ownStories.hasClass('hidden')) {
      $ownStories.empty();
    }
    $ownStories.hasClass('hidden') !== true ? $allStoriesList.addClass('hidden') : $allStoriesList.removeClass('hidden');
  }

  async function deleteOwnStory(e) { //This function works in tandem with api-class func deleteStory() to remove story from page and from user's own story array.
    const targetedStory = e.target.closest('li');
    targetedStory.remove(); //Removes story from page
    await storyList.deleteStory(targetedStory.id, currentUser); //Remove story from own story user array
    await generateStories(); //Regenerates new story list.
  }

  function clearInputs() { //this function clears submit story inputs on story submission
    $("#author").val("");
    $('#title').val("");
    $('#url').val("");
  }

  function highlightFavorites() { //This function highlights the user favorites.
    const favoritesId = currentUser.favorites.map(s => { //Stores ID's of stories in user's favorite story array.
      return s.storyId;
    });
    const $li = Array.from($("li")); //Creates array from DOM 'li' elements showing story on page.
    if(favoritesId.length > 0) { //If user has favorited story.
      for(favorite of favoritesId) { //Iterate over ID's of stories in user's favorite story array.
        for(li of $li) { //Iterate over DOM 'li' element array.
          if(li.id === favorite) { //If ID of DOM element is on user favorites array
            $(li).children('i').addClass('fa'); //It is marked as favorite.
          }
        }
      }
    } else { //If user has no favorites, nothing happens.
      return;
      }
  }


});
