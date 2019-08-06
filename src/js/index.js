import Search from "./models/Search";
import Recipe from "./models/Recipe";
import List from "./models/List";
import Likes from "./models/Likes";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeVIew";
import * as listView from "./views/listView";
import * as likesView from "./views/likesView";
import { elements, renderLoader, clearLoader } from "./views/base";

// Global State
// Search Object | Current Recipe Object
//  Shopping List Object | Liked Object
const state = {};

//Search Controller
const controlSearch = async () => {
  //Get query from View
  const query = searchView.getInput();

  if (query) {
    //Create new Search object and add it to State
    state.search = new Search(query);

    //Preapre UI for Results
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchResult);
    try {
      //Search for Recipes
      await state.search.getResults();

      //Render results on UI
      clearLoader();
      searchView.renderResults(state.search.result);
    } catch (error) {
      alert("Something went wrong [Network Error]");
      clearLoader();
    }
  }
};

elements.searchForm.addEventListener("submit", e => {
  e.preventDefault();
  controlSearch();
});

elements.searchResultPages.addEventListener("click", e => {
  const btn = e.target.closest(".btn-inline");
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);

    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});

//Recipe Controller
const controlRecipe = async () => {
  //Get ID from the URL
  const id = window.location.hash.replace("#", "");

  if (id) {
    //Prepare UI for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    //Highlight selected search item
    if (state.search) {
      searchView.highlightSelected(id);
    }

    //Create new Recipe Object
    state.recipe = new Recipe(id);

    try {
      //Get Recipe Data
      await state.recipe.getRecipe();
      state.recipe.parseIngridients();

      //Calculate Servings and time
      state.recipe.calcTime();
      state.recipe.calcServings();

      //Render Recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
    } catch (error) {
      console.log(error);
      alert("Error processing recipe [Recipe Error]");
    }
  }
};

// window.addEventListener("hashchange", controlRecipe);
// window.addEventListener("load", controlRecipe);

["hashchange", "load"].forEach(event =>
  window.addEventListener(event, controlRecipe)
);

//List Controller
const controlList = () => {
  //Create a new list if there is none yet
  if (!state.list) state.list = new List();

  //Add each ingrident to the list and UI
  state.recipe.ingredients.forEach(el => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

//Like Controller
const controlLike = () => {
  if (!state.likes) state.likes = new Likes();
  const currentId = state.recipe.id;

  //User has NOT liked current recipe
  if (!state.likes.isLiked(currentId)) {
    //Add the like to the data
    const newLike = state.likes.addLike(
      currentId,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );

    //Togggle the like button
    likesView.toggleLikedBtn(true);

    //Add like to UI list
    likesView.renderLike(newLike);
  } else {
    //Remove the like to the data
    state.likes.deleteLike(currentId);

    //Togggle the like button
    likesView.toggleLikedBtn(false);

    //Remove like to UI list
    likesView.deleteLike(currentId);
  }

  likesView.toggleLikeMenu(state.likes.getNumLikes());
};

//Restore liked recipies on page load
window.addEventListener("load", () => {
  state.likes = new Likes();

  //Read Storage
  state.likes.readStorage();

  //Toggle Btn
  likesView.toggleLikeMenu(state.likes.getNumLikes());

  //Render reciepies
  state.likes.likes.forEach(like => likesView.renderLike(like));
});

//Handle Delete and Update list item events
elements.shopping.addEventListener("click", e => {
  const id = e.target.closest(".shopping__item").dataset.item;
  if (e.target.matches("shopping__delete, .shopping__delete *")) {
    state.list.deleteItem(id);
    listView.deleteItem(id);
  } else if (e.target.matches(".shopping__count-value")) {
    const val = parseFloat(e.target.value, 10);
    state.list.updateCount(id, val);
  }
});

elements.recipe.addEventListener("click", e => {
  if (e.target.matches(".btn-decrease, .btn-decrease *")) {
    if (state.recipe.servings > 1) {
      state.recipe.updateServings("dec");
      recipeView.updateServingsIngridents(state.recipe);
    }
  } else if (e.target.matches(".btn-increase, .btn-increase *")) {
    state.recipe.updateServings("inc");
    recipeView.updateServingsIngridents(state.recipe);
  } else if (e.target.matches(".recipe__btn--add, .recipe__btn--add *")) {
    //Add to lisr
    controlList();
  } else if (e.target.matches(".recipe__love, .recipe__love *")) {
    controlLike();
  }
});
