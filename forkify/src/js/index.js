import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';


/** Golbal State of the app
 * - Search object
 * - Current recipe object
 * - shopping list object
 * - liked recipes
 */

 
const state = {};
/**
 * Search Controller
*/
const controlSearch = async () => {
    // 1- get query from view
    const query = searchView.getInput();

    if (query) {
        // 2- New search object and add it to state
        state.search = new Search(query);
        console.log(state.search);

        // 3- Preper UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try {
            // 4- Search For Recipes
            await state.search.getResults();

            // render results on ui
            clearLoader();
            searchView.renderResults(state.search.result);
        } catch (error) {
            alert(error + 'Something Wrong With The Search...!');
        }
    };
};

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

/* window.addEventListener('load', e => {
    e.preventDefault();
    controlSearch();
}); */

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goto = parseInt(btn.dataset.goto);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goto);
    }
});







/**
 * Recipe Controller
*/
const controlRecipe = async () => {
    const id = window.location.hash.replace('#', '');
    // console.log(id);

    if (id) {
        // 1- prepare UI for chnages
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // 2- hightlights selected search item
        if (state.search) searchView.highlightSelected(id);

        // 2- create new recipe object
        state.recipe = new Recipe(id);
        console.log(state.recipe);
        /* // TESTING
        window.r = state.recipe; */

        try {
            // 3- get recipe data
            await state.recipe.getRecipe();

            // 4- Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
            state.recipe.parseIngredients();

            // 5- render recipe
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
            );
            // console.log(state.recipe);

        } catch (error) {
            console.log(error)
            alert(error + 'Error Processing recipe !');
        };

    }
};
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));









/**
 * Likes Controller
*/
const controlLikes = () => {
    if (!state.likes) state.likes = new Likes();

    const currentId = state.recipe.id;

    // User Has not yet liked current recipe
    if (!state.likes.isLiked(currentId)) {
        // Add Like to the state
        const newLikes = state.likes.addLike(
            currentId,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img,
        );

        // Toggle the like button
        likesView.togglelikeBtn(true);

        // Add like to the ui
        likesView.renderLike(newLikes);
        console.log(state.likes);

        // User Has liked current recipe
    } else {
        // Add Like to the state
        state.likes.deleteLike(currentId);

        // Toggle the like button
        likesView.togglelikeBtn(false);

        // Remove like to the ui
        likesView.deleteLike(currentId);
        console.log(state.likes);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

window.addEventListener('load', _ => {
    state.likes = new Likes();

    // restore likes
    state.likes.readStorage();

    // Toggle the like button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // render the existing likes
    state.likes.likes.forEach(el => likesView.renderLike(el));
});









/**
 * List Controller
*/
const controlList = () => {
    if (!state.List) state.List = new List();

    listView.clearList();

    state.recipe.ingredients.forEach(el => {
        const item = state.List.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
};

elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    if (e.target.matches('.shopping__delete, .shopping__delete *')) {

        state.List.deleteItem(id);

        listView.deleteItem(id);

    } else if (e.target.matches('.shopping__count--value')) {
        const val = parseFloat(e.target.value);
        state.List.updateCount(id, val);
    }
})

// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }

    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);

    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        // Add ingredients to the shopping list
        controlList();

    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        controlLikes();
    }
});