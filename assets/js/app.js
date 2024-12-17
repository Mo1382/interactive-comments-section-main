// Data
const storage = localStorage.getItem("appData");
// console.log(storage);
let isScreenDesktop;
// Declaring here to be accessible in deleteBtn element event handler
let deletingEl;
const infoForReplyConfirm = [];
// Constant numbers
const FIVE_MINUTES_IN_MLS = 5 * 60 * 1000;

let addCommentEl;

// Functions
/**
 * Fetches data from the provided URL and returns the parsed JSON data.
 *
 * @param {string} url - The URL to fetch data from.
 * @returns {Promise<any>} - A Promise with data form the URL..
 */
const getData = async function (url) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    alert(
      "Something went wrong. Please check your internet connection and reload the page."
    );
  }
};

/**
 * Saves the provided data to the browser's local storage under the key "appData".
 *
 * @param {any} data - The data to be saved to local storage.
 */
const saveToLocalStorage = function (data) {
  localStorage.setItem("appData", JSON.stringify(data));
};

/**
 * Renders the initial HTML structure for the application, including a modal overlay and a container for the comment form.
 *
 * @param {HTMLElement} initHTMLWrapper - The HTML element where the initial HTML structure will be inserted.
 */
const renderInitHTML = function (initHTMLWrapper) {
  const initHTML = `
  <section class="modal-overlay">
    <div class="modal-wrapper">
      <h3 class="modal-title">Delete comment</h3>
      <div class="modal-desc">
        Are you sure you want to delete this comment? This will remove the
        comment and can't be undone.
      </div>
      <div class="modal-footer">
        <button class="cancel-modal-btn">NO, CANCEL</button>
        <button class="delete-modal-btn">YES, DELETE</button>
      </div>
    </div>
  </section>
  <main class="container">
  <form class="add-comment-wrapper">
      <div class="add-comment-thumb">
        <img src="" alt="">
      </div>
      <div class="add-comment-field-wrapper">
        <textarea class="add-comment-field" placeholder=" Add a comment..." required></textarea>
      </div>
      <button type="submit" id="send-btn" class="primary-btn">SEND</button>
    </form>
  </main>
  `;

  initHTMLWrapper.insertAdjacentHTML("afterbegin", initHTML);
};

/**
 * Checks if the provided comment object has any replies.
 *
 * @param {Object} commentObj - The comment object to check.
 * @returns {boolean} - True if the comment object has at least one reply, false otherwise.
 */
const hasCommentAnyReply = commentObj => commentObj.replies?.length > 0;

/**
 * Sets the specified property to false for each comment object and its replies.
 *
 * @param {Object[]} commentObjs - An array of comment objects.
 * @param {string} propName - The name of the property to set to false.
 */
const setPropFalse = function (commentObjs, propName) {
  commentObjs.forEach(commentObj => {
    commentObj[propName] = false;

    // Checking if comment has any reply or not
    if (!hasCommentAnyReply(commentObj)) return;

    commentObj.replies.forEach(replyObj => {
      replyObj[propName] = false;
    });
  });
};

/**
 * Checks if the provided usernames are the same.
 *
 * @param {string} firstUsername - The first username to compare.
 * @param {string} secondUsername - The second username to compare.
 * @returns {boolean} - True if the usernames are the same, false otherwise.
 */
const hasSameUsernames = (firstUsername, secondUsername) =>
  firstUsername === secondUsername;

/**
 * Filters the comments and replies in the provided application data to only include those made by the current user.
 *
 * @param {Object} appData - The application data containing the comments and replies.
 * @returns {Array} - An array containing the user's comments and replies.
 */
const filterUserCommentsReplies = function (appData) {
  const userCommentsReplies = appData.comments.reduce((acc, commentObj) => {
    if (
      hasSameUsernames(commentObj.user.username, appData.currentUser.username)
    )
      acc.push(commentObj);

    // Checking if comment has any reply or not
    if (!hasCommentAnyReply(commentObj)) return acc;

    const userReplies = [];
    commentObj.replies.forEach(replyObj => {
      if (
        hasSameUsernames(replyObj.user.username, appData.currentUser.username)
      )
        userReplies.push(replyObj);
    });

    acc.push(userReplies);

    return acc;
  }, []);

  return userCommentsReplies;
};

/**
 * Calculates the time difference between the current date and the provided created date, and returns a formatted string representing the time elapsed.
 *
 * @param {string} createdDateStr - The string representation of the created date.
 * @returns {string} - A formatted string representing the time elapsed since the created date.
 */

const timeToRender = function (createdDateStr) {
  const createdDate = new Date(createdDateStr);
  const currentDate = new Date();

  const timeDiffMs = currentDate - createdDate;

  const timeDiffMinutes = Math.floor(timeDiffMs / (1000 * 60));
  const timeDiffhours = Math.floor(timeDiffMinutes / 60);
  const timeDiffdays = Math.floor(timeDiffhours / 24);
  const timeDiffyears = Math.floor(timeDiffdays / 365.25);

  if (timeDiffyears >= 1)
    return `${timeDiffyears} year${timeDiffyears !== 1 ? "s" : ""} ago`;
  if (timeDiffdays >= 1)
    return `${timeDiffdays} day${timeDiffdays !== 1 ? "s" : ""} ago`;
  if (timeDiffhours >= 1)
    return `${timeDiffhours} hour${timeDiffhours !== 1 ? "s" : ""} ago`;
  if (timeDiffMinutes >= 1)
    return `${timeDiffMinutes} minute${timeDiffMinutes !== 1 ? "s" : ""} ago`;
  if (timeDiffMinutes < 1) return "now";
};

/**
 * Sets the thumbnail image dynamically for the add comment element.
 *
 * @param {HTMLElement} addCommentEl - The HTML element representing the add comment section.
 * @param {Object} appData - An object containing the current user's data, including the image URL.
 */
const setAddCommentThumb = function (addCommentEl, appData) {
  const thumbnailEl = addCommentEl.querySelector(".add-comment-thumb img");

  thumbnailEl.setAttribute(
    "src",
    `${appData.currentUser.image.webp.replace("/images", "/assets/images")}`
  );
};

/**
 * Changes the layout of the comments for desktop devices by moving the comment buttons and upvote/downvote elements to the header of the comment detail section.
 *
 * @param {HTMLElement[]} commentEls - An array of HTML elements representing the comments.
 */
const changeCommentsForDesktop = function (commentEls) {
  commentEls.forEach(el => {
    const commentBtnEls = el.querySelectorAll(".comment-btn");
    const upvoteDownvoteEl = el.querySelector(".comment-upvote-downvote");
    const commentEl = el.querySelector(".comment");
    const commentHeaderRightEl = el.querySelector(
      ".comment-detail-header-right"
    );
    const footerEl = el.querySelector(".comment-detail-footer");

    // Moving the upvote/downvote elements to the left of the comment
    commentEl.prepend(upvoteDownvoteEl);

    // Moving comment buttons to the right of the header
    commentBtnEls.forEach(btn => {
      commentHeaderRightEl.append(btn);
    });

    // Removing the footer element
    footerEl.remove();
  });
};

/**
 * Sets the layout of the comment section based on the screen width.
 * If the screen width is greater than 794 pixels, the layout is set to desktop mode.
 * Otherwise, the layout is set to mobile mode, where the comment buttons and upvote/downvote
 * elements are moved to the footer of the comment detail section.
 */
const setLayout = function () {
  const screenWidth = window.innerWidth;

  if (screenWidth > 794) {
    isScreenDesktop = true;
    return;
  }
  isScreenDesktop = false;
};

/**
 * Generates an HTML string for a comment/reply description.
 *
 * @param {Object} obj - An object containing the reply details.
 * @param {string} obj.replyingTo - The username of the person being replied to.
 * @param {string} obj.content - The content of the reply.
 * @returns {string} The HTML string for the comment reply description.
 */
const makeCommentReplyDescHTML = function (obj) {
  return `<p>
      ${
        obj.replyingTo
          ? `<span class="replied-username"> ${"@" + obj.replyingTo}</span>`
          : ""
      }
      ${obj.content}
    </p>`;
};

/**
 * Renders a comment element with the provided comment object, comment number, and next element.
 *
 * @param {Object} commentObj - The comment object containing the data to render.
 * @param {number} commentNum - The number of the comment.
 * @param {HTMLElement} nextEL - The next element to insert the comment element before.
 * @param {boolean} [isHidden=false] - Whether the comment element should be initially hidden.
 */
const renderCommentEl = function (
  commentObj,
  nextEL,
  isHidden = false,
  isCurrentUser,
  isDesktop
) {
  const btnsHTML = isCurrentUser
    ? `<div class="comment-btn delete-btn">
<svg width="12" height="14" xmlns="http://www.w3.org/2000/svg">
    <path
    d="M1.167 12.448c0 .854.7 1.552 1.555 1.552h6.222c.856 0 1.556-.698 1.556-1.552V3.5H1.167v8.948Zm10.5-11.281H8.75L7.773 0h-3.88l-.976 1.167H0v1.166h11.667V1.167Z"
    fill="#ED6368" />
</svg>
<span>Delete</span>
</div>
<div class="comment-btn edit-btn">
<svg width="14" height="14" xmlns="http://www.w3.org/2000/svg">
    <path
    d="M13.479 2.872 11.08.474a1.75 1.75 0 0 0-2.327-.06L.879 8.287a1.75 1.75 0 0 0-.5 1.06l-.375 3.648a.875.875 0 0 0 .875.954h.078l3.65-.333c.399-.04.773-.216 1.058-.499l7.875-7.875a1.68 1.68 0 0 0-.061-2.371Zm-2.975 2.923L8.159 3.449 9.865 1.7l2.389 2.39-1.75 1.706Z"
    fill="#5357B6" />
</svg>
<span>Edit</span>
</div>`
    : `<div class="comment-btn reply-btn">
            <svg width="14" height="13" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M.227 4.316 5.04.16a.657.657 0 0 1 1.085.497v2.189c4.392.05 7.875.93 7.875 5.093 0 1.68-1.082 3.344-2.279 4.214-.373.272-.905-.07-.767-.51 1.24-3.964-.588-5.017-4.829-5.078v2.404c0 .566-.664.86-1.085.496L.227 5.31a.657.657 0 0 1 0-.993Z"
                fill="#5357B6" />
            </svg>
            <span>Reply</span>
        </div>`;

  const upvoteDownvoteHTML = `
  <div class="comment-upvote-downvote">
            <div class="upvote-icon">
              <svg width="11" height="11" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6.33 10.896c.137 0 .255-.05.354-.149.1-.1.149-.217.149-.354V7.004h3.315c.136 0 .254-.05.354-.149.099-.1.148-.217.148-.354V5.272a.483.483 0 0 0-.148-.354.483.483 0 0 0-.354-.149H6.833V1.4a.483.483 0 0 0-.149-.354.483.483 0 0 0-.354-.149H4.915a.483.483 0 0 0-.354.149c-.1.1-.149.217-.149.354v3.37H1.08a.483.483 0 0 0-.354.15c-.1.099-.149.217-.149.353v1.23c0 .136.05.254.149.353.1.1.217.149.354.149h3.333v3.39c0 .136.05.254.15.353.098.1.216.149.353.149H6.33Z"
                  fill="#C5C6EF" />
              </svg>
            </div>
            <span class="rate-number">${commentObj.score}</span>
            <div class="downvote-icon">
              <svg width="11" height="3" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9.256 2.66c.204 0 .38-.056.53-.167.148-.11.222-.243.222-.396V.722c0-.152-.074-.284-.223-.395a.859.859 0 0 0-.53-.167H.76a.859.859 0 0 0-.53.167C.083.437.009.57.009.722v1.375c0 .153.074.285.223.396a.859.859 0 0 0 .53.167h8.495Z"
                  fill="#C5C6EF" />
              </svg>
            </div>
          </div>`;

  const commentFooterHTML = `
<div class="comment-detail-footer">
${upvoteDownvoteHTML}
 <div class="comment-btns">
 ${btnsHTML}
 </div>
    </div>
`;

  const commentHTML = `
        <div class="comment-reply-wrapper" style="${
          isHidden ? "opacity:0" : ""
        }">
      <div class="comment-wrapper ${
        isCurrentUser ? "active-user-comment" : ""
      }" data-id="${commentObj.id}">
        <div class="comment">
          ${isDesktop ? upvoteDownvoteHTML : ""}
          <div class="comment-detail">
            <div class="comment-detail-header">
              <div class="comment-detail-header-left">
                <div class="comment-thumbnail">
                  <img src="${commentObj.user.image.webp.replace(
                    "/images",
                    "/assets/images"
                  )}" alt="">
                </div>
                <div class="comment-username">${commentObj.user.username}</div>
                <div class="comment-date">${timeToRender(
                  commentObj.createdAt
                )}</div>
              </div>
              <div class="comment-detail-header-right">
              ${isDesktop ? btnsHTML : ""}
              </div>
            </div>
            <div class="comment-detail-body">
                ${makeCommentReplyDescHTML(commentObj)}       
            </div>
            ${!isDesktop ? commentFooterHTML : ""}
          </div>
        </div>
      </div>
    </div>
        `;

  // console.log(commentHTML);
  nextEL.insertAdjacentHTML("beforebegin", commentHTML);
};

/**
 * Renders a reply element for a comment.
 *
 * @param {Object} replyObj - The reply object containing the data to render.
 * @param {HTMLElement} parentEL - The parent element to append the reply element to.
 */
const renderReplyEl = function (
  replyObj,
  parentEL,
  isHidden = false,
  isCurrentUser,
  isDesktop
) {
  const btnsHTML = isCurrentUser
    ? `<div class="comment-btn delete-btn">
<svg width="12" height="14" xmlns="http://www.w3.org/2000/svg">
    <path
    d="M1.167 12.448c0 .854.7 1.552 1.555 1.552h6.222c.856 0 1.556-.698 1.556-1.552V3.5H1.167v8.948Zm10.5-11.281H8.75L7.773 0h-3.88l-.976 1.167H0v1.166h11.667V1.167Z"
    fill="#ED6368" />
</svg>
<span>Delete</span>
</div>
<div class="comment-btn edit-btn">
<svg width="14" height="14" xmlns="http://www.w3.org/2000/svg">
    <path
    d="M13.479 2.872 11.08.474a1.75 1.75 0 0 0-2.327-.06L.879 8.287a1.75 1.75 0 0 0-.5 1.06l-.375 3.648a.875.875 0 0 0 .875.954h.078l3.65-.333c.399-.04.773-.216 1.058-.499l7.875-7.875a1.68 1.68 0 0 0-.061-2.371Zm-2.975 2.923L8.159 3.449 9.865 1.7l2.389 2.39-1.75 1.706Z"
    fill="#5357B6" />
</svg>
<span>Edit</span>
</div>`
    : `<div class="comment-btn reply-btn">
            <svg width="14" height="13" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M.227 4.316 5.04.16a.657.657 0 0 1 1.085.497v2.189c4.392.05 7.875.93 7.875 5.093 0 1.68-1.082 3.344-2.279 4.214-.373.272-.905-.07-.767-.51 1.24-3.964-.588-5.017-4.829-5.078v2.404c0 .566-.664.86-1.085.496L.227 5.31a.657.657 0 0 1 0-.993Z"
                fill="#5357B6" />
            </svg>
            <span>Reply</span>
        </div>`;

  const upvoteDownvoteHTML = `
  <div class="comment-upvote-downvote">
            <div class="upvote-icon">
              <svg width="11" height="11" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6.33 10.896c.137 0 .255-.05.354-.149.1-.1.149-.217.149-.354V7.004h3.315c.136 0 .254-.05.354-.149.099-.1.148-.217.148-.354V5.272a.483.483 0 0 0-.148-.354.483.483 0 0 0-.354-.149H6.833V1.4a.483.483 0 0 0-.149-.354.483.483 0 0 0-.354-.149H4.915a.483.483 0 0 0-.354.149c-.1.1-.149.217-.149.354v3.37H1.08a.483.483 0 0 0-.354.15c-.1.099-.149.217-.149.353v1.23c0 .136.05.254.149.353.1.1.217.149.354.149h3.333v3.39c0 .136.05.254.15.353.098.1.216.149.353.149H6.33Z"
                  fill="#C5C6EF" />
              </svg>
            </div>
            <span class="rate-number">${replyObj.score}</span>
            <div class="downvote-icon">
              <svg width="11" height="3" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9.256 2.66c.204 0 .38-.056.53-.167.148-.11.222-.243.222-.396V.722c0-.152-.074-.284-.223-.395a.859.859 0 0 0-.53-.167H.76a.859.859 0 0 0-.53.167C.083.437.009.57.009.722v1.375c0 .153.074.285.223.396a.859.859 0 0 0 .53.167h8.495Z"
                  fill="#C5C6EF" />
              </svg>
            </div>
          </div>`;

  const commentFooterHTML = `
<div class="comment-detail-footer">
${upvoteDownvoteHTML}
 <div class="comment-btns">
 ${btnsHTML}
 </div>
    </div>
`;

  const replyHTML = `<div data-id="${
    replyObj.id
  }" class="comment-wrapper reply-comment-wrapper ${
    isCurrentUser ? "active-user-comment" : ""
  }" style="${isHidden ? "opacity:0" : ""}">
          <div class="comment">
            ${isDesktop ? upvoteDownvoteHTML : ""}
            <div class="comment-detail">
              <div class="comment-detail-header">
                <div class="comment-detail-header-left">
                  <div class="comment-thumbnail">
                    <img src="${replyObj.user.image.webp.replace(
                      "/images",
                      "/assets/images"
                    )}" alt="">
                  </div>
                  <div class="comment-username">${replyObj.user.username}</div>
                  <div class="comment-date">${timeToRender(
                    replyObj.createdAt
                  )}</div>
                </div>
                <div class="comment-detail-header-right">
                  ${isDesktop ? btnsHTML : ""}
                </div>
              </div>
              <div class="comment-detail-body">
              ${makeCommentReplyDescHTML(replyObj)}
              </div>
               ${!isDesktop ? commentFooterHTML : ""}
            </div>
          </div>
        </div>`;

  //   console.log(replyHTML);
  parentEL.insertAdjacentHTML("beforeend", replyHTML);
};

/**
 * Renders the comments and their replies in the UI.
 *
 * @param {Object[]} commentObjs - An array of comment objects to be rendered.
 * @param {string} commentObjs[].id - The unique identifier of the comment.
 * @param {string} commentObjs[].content - The content of the comment.
 * @param {Object} commentObjs[].user - The user who made the comment.
 * @param {string} commentObjs[].user.username - The username of the comment author.
 * @param {string} commentObjs[].user.image.webp - The URL of the comment author's profile picture.
 * @param {number} commentObjs[].createdAt - The timestamp when the comment was created.
 * @param {number} commentObjs[].score - The score (upvotes - downvotes) of the comment.
 * @param {Object[]} commentObjs[].replies - An array of reply objects for the comment.
 */
const renderCommentsReplies = function (appData) {
  const commentObjs = appData.comments;

  commentObjs.forEach(commentObj => {
    const isCurrentUser =
      commentObj.user.username === appState.currentUser.username;

    renderCommentEl(
      commentObj,
      addCommentEl,
      undefined,
      isCurrentUser,
      isScreenDesktop
    );

    // Checking if comment has any reply or not
    if (!hasCommentAnyReply(commentObj)) return;

    const commentReplyWrapperEl = document.querySelector(
      `.comment-wrapper[data-id="${commentObj.id}"]`
    ).parentElement;
    const repliesWrapperEl = document.createElement("div");
    repliesWrapperEl.classList.add("reply-wrapper");
    commentReplyWrapperEl.append(repliesWrapperEl);

    commentObj.replies.forEach(replyObj => {
      const isCurrentUser =
        replyObj.user.username === appState.currentUser.username;

      renderReplyEl(
        replyObj,
        repliesWrapperEl,
        undefined,
        isCurrentUser,
        isScreenDesktop
      );
    });
  });
};

/**
 * Changes the layout of the comments for mobile devices by moving the comment buttons and upvote/downvote elements to the footer of the comment detail section.
 *
 * @param {HTMLElement[]} commentEls - An array of HTML elements representing the comments.
 */
const changeCommentsForMobiles = function (commentEls) {
  commentEls.forEach(el => {
    const commentBtnEls = el.querySelectorAll(".comment-btn");
    const upvoteDownvoteEl = el.querySelector(".comment-upvote-downvote");
    const commentDetailEl = el.querySelector(".comment-detail");

    // Creating a footer element to hold the comment buttons and upvote/downvote elements
    const detailFooterEl = document.createElement("div");
    detailFooterEl.innerHTML = "<div class='comment-btns'></div>";

    const btnsWrapper = detailFooterEl.querySelector(".comment-btns");

    detailFooterEl.classList.add("comment-detail-footer");
    commentDetailEl.append(detailFooterEl);

    // Moving the upvote/downvote elements to the footer
    detailFooterEl.prepend(upvoteDownvoteEl);

    // Moving comment buttons to the footer
    commentBtnEls.forEach(btn => {
      btnsWrapper.append(btn);
    });
  });
};

const appState = storage
  ? JSON.parse(storage)
  : await getData("http://127.0.0.1:5500/data.json");

// console.log(appState);

/**
 * Initializes the application state and renders the comments and replies.
 *
 * This function is responsible for the following tasks:
 * - Sets the `isReplying` property to `false` for all comments and replies in the `appData.comments` array.
 * - Sets the `isEditing` property to `false` for all user comments and replies in the `appData.comments` array.
 * - Calls the `renderCommentsReplies` function to render the comments and replies.
 * - Calls the `setLayout` function to set the layout of the comment section based on the screen width.
 *
 * @param {Object} appData - The application data object containing the comments and replies.
 */
const init = function (appData) {
  renderInitHTML(document.body);

  // Move here to be accessible for renderCommentsReplies function.
  addCommentEl = document.querySelector(".container > .add-comment-wrapper");

  setAddCommentThumb(document.querySelector(".add-comment-wrapper"), appData);

  // Setting isReplying to false for all comments and replies
  setPropFalse(appData.comments, "isReplying");
  // console.log(appData);

  // console.log(filterUserCommentsReplies(appData));

  setPropFalse(filterUserCommentsReplies(appData).flat(), "isEditing");
  // console.log(filterUserCommentsReplies(appData));

  setLayout();

  renderCommentsReplies(appData);
};

init(appState);

// DOM Elements (move here after init HTML rendered to be accesssible))
const containerEl = document.querySelector(".container");
const addCommentFieldEl = addCommentEl.querySelector(
  ".container > .add-comment-wrapper .add-comment-field"
);
const commentReplyWrapperEl = document.querySelector(".comment-reply-wrapper");
const sendBtn = document.querySelector("#send-btn");
const modalOverlayEl = document.querySelector(".modal-overlay");
const modalWrapperEl = document.querySelector(".modal-wrapper");
const modalDeleteBtn = document.querySelector(".delete-modal-btn");
const modalCancelBtn = document.querySelector(".cancel-modal-btn");

/**
 * Retrieves all the comment and reply wrapper elements on the page.
 *
 * @returns {HTMLElement[]} An array of all the comment and reply wrapper elements.
 */
const getAllCommentReplyEls = () => [
  ...document.querySelectorAll(".comment-wrapper"),
];

/**
 * Retrieves all the reply objects from the provided array of comment objects.
 *
 * @param {Object[]} commentObjs - An array of comment objects, each containing a `replies` property.
 * @returns {Object[]} An array of all the reply objects from the provided comment objects.
 */
const getAllReplyObjs = commentObjs =>
  commentObjs.flatMap(comment => comment.replies);

/**
 * Retrieves an array containing all comment and reply objects.
 *
 * @param {Object[]} allComments - An array of all comment objects.
 * @param {Object[]} allReplies - An array of all reply objects.
 * @returns {Object[]} An array containing all comment and reply objects.
 */
const getAllCommentReplyObjs = (allComments, allReplies) => [
  ...allComments,
  ...allReplies,
];

/**
 * Creates a new comment object with the provided content and adds it to the application state.
 *
 * @param {Object} appData - The application data object containing the comments and replies.
 * @param {string} commentContent - The content of the new comment.
 * @returns {Object} The newly created comment object.
 */
const createCommentReplyObj = function (
  appData,
  content,
  isComment = true,
  replyToObj = undefined
) {
  // Calculating the comment and reply num for new comment id
  // Does not work all the time (having comments or replies with the same id)
  // const commentsNum = appData.comments.length;
  // const repliesNum = appData.comments.reduce((acc, comment) => {
  //   return acc + comment.replies.length;
  // }, 0);
  //   console.log(commentsNum, repliesNum);

  const allReplies = getAllReplyObjs(appState.comments);
  const allCommentReplies = getAllCommentReplyObjs(
    appState.comments,
    allReplies
  );

  const maxId = allCommentReplies.reduce((max, obj) => {
    return obj.id > max ? obj.id : max;
  }, allCommentReplies[0].id);

  const commentReplyDiff = new Map();
  if (isComment) commentReplyDiff.set("replies", []);
  else commentReplyDiff.set("replyingTo", replyToObj.user.username);
  const diffToObject = Object.fromEntries(commentReplyDiff);

  const newObjContent = isComment
    ? content
    : // Removing @username(.) of content to save in Object
      content.replace(new RegExp(`@${replyToObj.user.username}\\.?`), "");

  const newObj = {
    // id: commentsNum + repliesNum + 1,
    id: maxId + 1,
    content: newObjContent,
    createdAt: new Date().toISOString(),
    score: 0,
    user: { ...appData.currentUser },
    ...diffToObject,
  };
  //   console.log(newObj);

  if (isComment) appData.comments.push(newObj);
  // If we have a reply and it's a reply to a comment
  else if (!replyToObj.replyingTo) replyToObj.replies.push(newObj);
  // If we have a reply and it's a reply to a reply
  else {
    const commentToAddReply = appData.comments.find(comment =>
      comment.replies.includes(replyToObj)
    );

    commentToAddReply.replies.push(newObj);
  }

  return newObj;
};

/**
 * Shows the newly added comment by setting its opacity to 1 after a short delay.
 *
 * @param {HTMLElement[]} commentWrapperEls - An array of comment wrapper elements.
 */
const showAddedCommentReply = function (allEls) {
  // Set the opacity to 1 after the element is added to the DOM
  const addedCommentReplyEl = [...allEls].at(-1);

  // Set the opacity to 1 to create an animation
  // Use a timeout to ensure the transition is triggered after the element is added to the DOM
  setTimeout(() => {
    addedCommentReplyEl.style.opacity = 1;
  }, 0);
};

/**
 * Renders an error message for an empty input field.
 *
 * @param {HTMLElement} fieldEl - The input field element.
 * @param {HTMLElement} fieldWrapperEl - The wrapper element for the input field.
 * @returns {void}
 */
const renderEmptyFieldError = function (fieldEl, fieldWrapperEl) {
  fieldEl.focus();

  fieldWrapperEl.classList.add("show-error");
};

/**
 * Finds the comment or reply object from the provided array of comment objects based on the element's data-id attribute.
 *
 * @param {Object[]} commentObjs - An array of comment objects.
 * @param {HTMLElement} el - The HTML element associated with the comment or reply.
 * @returns {Object|undefined} The comment or reply object, or undefined if not found.
 */
const findObjFromEl = function (commentObjs, el) {
  const elId = +el.dataset.id;
  // console.log(elId);

  const activeComment = commentObjs.find(commentObj => {
    return commentObj.id === elId;
  });

  // console.log(activeComment);

  if (activeComment) return activeComment;

  // Select all replies and then check which one matches the id
  const activeReply = commentObjs
    .flatMap(commentObj => commentObj.replies)
    .find(reply => reply.id === elId);

  // console.log(activeReply);

  return activeReply;
};

/**
 * Calculates the animation duration of the provided HTML element based on its transition duration.
 *
 * @param {HTMLElement} el - The HTML element to calculate the animation duration for.
 * @returns {number} The animation duration in milliseconds.
 */
const calcElAnimeDuration = function (el) {
  const elDurationMs =
    parseFloat(window.getComputedStyle(el).transitionDuration) * 1000;

  return elDurationMs;
};

/**
 * Opens a modal by setting the display property of the modal wrapper element to "flex" and
 * setting the opacity of the first child element of the modal wrapper to 1 after a short delay.
 *
 * @param {HTMLElement} modalWrapperEl - The HTML element that wraps the whole modal section..
 */
const openModal = function (modalWrapperEl) {
  modalWrapperEl.style.display = "flex";
  modalWrapperEl.style.opacity = 1;

  setTimeout(function () {
    modalWrapperEl.firstElementChild.style.opacity = 1;
  }, 0);
};

/**
 * Closes a modal by setting the opacity of the modal wrapper element and its first child element to 0, and then hiding the modal wrapper element after a short delay.
 *
 * @param {HTMLElement} modalWrapperEl - The HTML element that wraps the whole modal section.
 */
const closeModal = function (modalWrapperEl) {
  modalWrapperEl.firstElementChild.style.opacity = 0;
  modalWrapperEl.style.opacity = 0;

  const elHideDurationMs = calcElAnimeDuration(
    modalWrapperEl.firstElementChild
  );

  setTimeout(function () {
    modalWrapperEl.style.display = "none";
  }, elHideDurationMs);
};

/**
 * Checks if the reply field is empty or contains only the reply-to username.
 *
 * @param {HTMLElement} fieldEl - The HTML element representing the reply field.
 * @param {string} replyToUsername - The username of the person the reply is being made to.
 * @returns {boolean} `true` if the reply field is empty or contains only the reply-to username, `false` otherwise.
 */
const isReplyFieldEmpty = function (fieldEl, replyToUsername) {
  const replyText = fieldEl.value;

  return (
    replyText === `@${replyToUsername}.` || replyText === `@${replyToUsername}`
  );
};

/**
 * Finds the HTML element that corresponds to the provided object.
 *
 * @param {HTMLElement[]} allEls - An array of all the HTML elements to search through.
 * @param {Object} obj - The object to find the corresponding HTML element for.
 * @returns {HTMLElement} The HTML element that corresponds to the provided object, or `undefined` if no matching element is found.
 */
const findElFromObj = function (allEls, obj) {
  const objId = obj.id;

  const foundEL = allEls.find(el => +el.dataset.id === objId);

  return foundEL;
};

/**
 * Updates the score of a comment in the application state and the corresponding UI element.
 *
 * @param {boolean} isUpvote - Indicates whether the score should be incremented (true) or decremented (false).
 * @param {HTMLElement} clickedEl - The HTML element that was clicked to trigger the score update.
 * @param {Object} appData - The application state object containing the comments.
 */
const updateScore = function (isUpvote, clickedEl, appData) {
  const revelantEl = clickedEl.closest(".comment-wrapper");
  const revelantObj = findObjFromEl(appData.comments, revelantEl);

  // Updating the score of relevant comment obj
  isUpvote ? revelantObj.score++ : revelantObj.score--;

  // Updating the score of relevant comment el in UI
  const scoreEl = revelantEl.querySelector(".rate-number");
  scoreEl.textContent = revelantObj.score;

  saveToLocalStorage(appData);
};

/**
 * Deletes an object from a collection of comment objects or their replies.
 *
 * @param {boolean} isComment - Indicates whether the object to be deleted is a top-level comment or a reply.
 * @param {Object[]} commentObjs - The collection of comment objects, or the replies array of a comment object.
 * @param {Object} deletingObj - The object to be deleted.
 */
const deleteObj = function (isComment, commentObjs, deletingObj) {
  // Finding deleting obj wrapper to delete it from there
  const deletingObjWrapper = isComment
    ? commentObjs
    : commentObjs.find(commentObj => commentObj.replies.includes(deletingObj))
        .replies;

  // Finding deleting obj index in its wrapper obj
  const deleteObjIndex = deletingObjWrapper.indexOf(deletingObj);

  // Deleting the deleting obj from its wrapper
  deletingObjWrapper.splice(deleteObjIndex, 1);
};

/**
 * Removes a comment or reply element from the DOM after a specified duration.
 *
 * @param {HTMLElement} deletingEl - The comment or reply element to be removed.
 * @param {number} hideDurationMls - The duration in milliseconds after which the element will be removed.
 */
const removeDeletingEl = function (deletingEl, hideDurationMls) {
  let isGoingToDelete;
  const deletingWrapperEl = deletingEl.parentElement;

  if (!deletingEl.classList.contains("reply-comment-wrapper"))
    // Executed when user wants to delete the comment
    isGoingToDelete = deletingWrapperEl;
  else if (deletingWrapperEl.children.length === 1)
    // Executed when user wants to delete the only reply of a comment
    isGoingToDelete = deletingWrapperEl;
  // Executed when user wants to delete the one reply of a comment
  else isGoingToDelete = deletingEl;

  isGoingToDelete.style.opacity = 0;
  setTimeout(() => {
    isGoingToDelete.remove();
  }, hideDurationMls);
};

/**
 * CLoses all replying fields in UI and resets their state.
 *
 * @param {HTMLElement[]} replyingEls - An array of HTML elements representing the replying fields.
 * @param {Object[]} replyingObjs - An array of objects representing the replying state.
 */
const resetReplyingFields = function (replyingEls, replyingObjs) {
  replyingEls.forEach(el => el.querySelector(".add-comment-wrapper").remove());

  replyingObjs.forEach(obj => (obj.isReplying = false));
};

/**
 * CLoses all editing fields in UI and resets their state.
 *
 * @param {HTMLElement[]} editingEls - An array of HTML elements representing the comment elements being edited.
 * @param {Object[]} editingObjs - An array of objects representing the comment objects being edited.
 */
const resetEditingFields = function (editingEls, editingObjs) {
  editingEls.forEach((el, i) => {
    const obj = editingObjs[i];

    const editFieldWrapper = el.querySelector(".add-comment-field-wrapper");
    const updateBtn = el.querySelector(".comment-update");
    const descWrapperEl = el.querySelector(".comment-detail-body");

    // console.log(obj, el);
    // console.log(editField);

    // Removing all edit fields and update btns in page
    editFieldWrapper.remove();
    updateBtn.remove();

    const descHTML = makeCommentReplyDescHTML(obj);

    descWrapperEl.insertAdjacentHTML("afterbegin", descHTML);

    obj.isEditing = false;
    // console.log(editingObjs, editingEls);
  });
};

/**
 * Updates the posted time for each comment element in the UI.
 *
 * @param {HTMLElement[]} allEls - An array of HTML elements representing the comment elements.
 * @param {Object[]} commentObjs - An array of comment objects corresponding to the comment elements.
 */
const updateCommentsPostedTime = function (allEls, commentObjs) {
  allEls.forEach(el => {
    const dateEl = el.querySelector(".comment-date");
    const revelantObj = findObjFromEl(commentObjs, el);

    dateEl.textContent = timeToRender(revelantObj.createdAt);
  });
};

// Event handlers
window.addEventListener("resize", function () {
  const screenWidth = window.innerWidth;
  const commentWrapperEls = document.querySelectorAll(".comment-wrapper");

  if (screenWidth <= 794 && isScreenDesktop) {
    isScreenDesktop = false;

    changeCommentsForMobiles(commentWrapperEls);
  }

  if (screenWidth > 794 && !isScreenDesktop) {
    isScreenDesktop = true;

    changeCommentsForDesktop(commentWrapperEls);
  }
});

sendBtn.addEventListener("click", function (e) {
  e.preventDefault();

  const addCommentFieldEl =
    e.target.previousElementSibling.querySelector(".add-comment-field");
  const addCommentFieldWrapperEl = e.target.previousElementSibling;
  const textareaContent = addCommentFieldEl.value;

  if (textareaContent.trim() === "") {
    renderEmptyFieldError(addCommentFieldEl, addCommentFieldWrapperEl);

    return;
  }

  const newCommentObj = createCommentReplyObj(appState, textareaContent);
  // console.log(appState.comments);

  // Render the new comment with opacity : 0
  renderCommentEl(newCommentObj, addCommentEl, true, true, isScreenDesktop);

  showAddedCommentReply(document.querySelectorAll(".comment-reply-wrapper"));

  saveToLocalStorage(appState);

  // Clear the field after the new comment has been rendered
  addCommentFieldEl.value = "";
});

// Event delegation for edit btns
containerEl.addEventListener("click", function (e) {
  const clickedEl = e.target;

  // Matching strategy
  if (!clickedEl.closest(".edit-btn")) return;
  //   console.log("matching strategy works");

  // Finding the revelant comment el and obj of edit btn clicked
  const revelantEl = clickedEl.closest(".comment-wrapper");
  const revelantObj = findObjFromEl(appState.comments, revelantEl);
  //   console.log(revelantObj);

  // Avoiding next instructions if the comment is already being edited
  if (revelantObj.isEditing) return;

  revelantObj.isEditing = true;

  // Elemensts selection to change comment layout for editing it
  const commentBodyEl = revelantEl.querySelector(".comment-detail-body");
  const commentDescEl = revelantEl.querySelector(".comment-detail-body p");
  const commentEl = revelantEl.querySelector(".comment");
  const commentDetailEl = revelantEl.querySelector(".comment-detail");

  commentEl.classList.add("comment-edit");

  commentDescEl.remove();

  const editFieldHTML = `
  <div class="add-comment-field-wrapper">
<textarea class="add-comment-field" placeholder="Add a comment..." required>
${revelantObj.content}
</textarea>
</div>
  `;

  commentBodyEl.insertAdjacentHTML("afterbegin", editFieldHTML);

  const updateBtnHTML = `
<div class="comment-update">
    <button class="primary-btn update-btn">UPDATE</button>
</div>
  `;

  commentDetailEl.insertAdjacentHTML("beforeend", updateBtnHTML);
});

// Event delegation for update btns
containerEl.addEventListener("click", function (e) {
  const clickedEl = e.target;

  // Matching strategy
  if (!clickedEl.classList.contains("update-btn")) return;
  //   console.log("matching strategy works");

  // Finding the revelant comment el and obj of update btn clicked
  const revelantEl = clickedEl.closest(".comment-wrapper");
  const revelantObj = findObjFromEl(appState.comments, revelantEl);
  //   console.log(revelantObj);

  const textFieldWrapperEl = revelantEl.querySelector(
    ".add-comment-field-wrapper"
  );
  const textFieldEl = revelantEl.querySelector(".add-comment-field");

  const newEditedContent = textFieldEl.value;

  if (newEditedContent.trim() === "") {
    renderEmptyFieldError(textFieldEl, textFieldWrapperEl);

    return;
  }

  revelantObj.content = newEditedContent;

  // Elemensts selection to change comment layout for updating it
  const commentEl = revelantEl.querySelector(".comment");
  const commentBodyEl = revelantEl.querySelector(".comment-detail-body");
  const updateBtnHTML = revelantEl.querySelector(".comment-update");

  textFieldWrapperEl.remove();

  const descHTML = makeCommentReplyDescHTML(revelantObj);

  commentBodyEl.insertAdjacentHTML("afterbegin", descHTML);

  commentEl.classList.remove("comment-edit");

  updateBtnHTML.remove();

  revelantObj.isEditing = false;

  saveToLocalStorage(appState);
});

// Event delegation for delete btns
containerEl.addEventListener("click", function (e) {
  const clickedEl = e.target;

  // Matching strategy
  if (!clickedEl.closest(".delete-btn")) return;

  openModal(modalOverlayEl);

  // It's going to be deleted when the user clicks "YES, DELETE" btn
  deletingEl = clickedEl.closest(".comment-wrapper");
});

modalDeleteBtn.addEventListener("click", function (e) {
  const deletingObj = findObjFromEl(appState.comments, deletingEl);
  //   console.log(deletingObj);

  const isComment = deletingObj.replyingTo ? false : true;

  deleteObj(isComment, appState.comments, deletingObj);

  const elHideDurationMs = calcElAnimeDuration(
    document.querySelector(".comment-reply-wrapper")
  );

  removeDeletingEl(deletingEl, elHideDurationMs);

  deletingEl = undefined;

  saveToLocalStorage(appState);

  closeModal(modalOverlayEl);
});

modalCancelBtn.addEventListener("click", function (e) {
  closeModal(modalOverlayEl);
});

// Event delegation for reply btns
containerEl.addEventListener("click", function (e) {
  const clickedEl = e.target;

  // Matching strategy
  if (!clickedEl.closest(".reply-btn")) return;

  const revelantEl = clickedEl.closest(".comment-wrapper");
  const revelantObj = findObjFromEl(appState.comments, revelantEl);

  if (revelantObj.isReplying) return;

  revelantObj.isReplying = true;

  const addReplyHTML = `
<form class="add-comment-wrapper">
  <div class="add-comment-thumb">
    <img src="${appState.currentUser.image.webp.replace(
      "/images",
      "/assets/images"
    )}" alt="">
  </div>
  <div class="add-comment-field-wrapper">
    <textarea class="add-comment-field" placeholder="Add a comment..."></textarea>
  </div>
  <button class="primary-btn confirm-reply-btn">REPLY</button>
</form>
  `;
  // console.log(addReplyHTML);

  revelantEl.insertAdjacentHTML("beforeend", addReplyHTML);

  const addRelpyFieldEl = revelantEl.querySelector(".add-comment-field");
  addRelpyFieldEl.value = `@${revelantObj.user.username}.`;

  /**
   * Exports an object containing relevant elements and objects for the reply confirmation functionality.
   * @returns {Object} An object with the following properties:
   *   - revelantEl: The closest `.comment-wrapper` element to the clicked reply button.
   *   - revelantObj: The corresponding comment object from `appState.comments` for the `revelantEl`.
   *   - addCommentFieldEl: The textarea element for adding a new reply comment.
   */
  const exportInfoForReplyConfirm = function () {
    return [revelantEl, revelantObj];
  };

  infoForReplyConfirm.push(exportInfoForReplyConfirm());
  // console.log(infoForReplyConfirm);
});

// Event delegation for reply confirm reply btns
containerEl.addEventListener("click", function (e) {
  e.preventDefault();
  const clickedEl = e.target;

  // Matching strategy
  if (!clickedEl.classList.contains("confirm-reply-btn")) return;

  const updateRelevantEl = clickedEl.closest(".comment-wrapper");

  const selectedInfoForReplyConfirm = infoForReplyConfirm.find(
    ([relevantEl]) => relevantEl === updateRelevantEl
  );

  // Data needed for the reply confirmation functionality
  const [revelantEl, revelantObj] = selectedInfoForReplyConfirm;
  const addReplyEl = revelantEl.querySelector(".add-comment-wrapper");
  const addRelpyFieldEl = revelantEl.querySelector(".add-comment-field");
  const addRelpyFieldWrapperEl = revelantEl.querySelector(
    ".add-comment-field-wrapper"
  );
  const replyText = revelantEl.querySelector(".add-comment-field").value;
  const commentReplyWrapperEl = revelantEl.closest(".comment-reply-wrapper");

  if (replyText.trim() === "") {
    renderEmptyFieldError(addRelpyFieldEl, addRelpyFieldWrapperEl);

    return;
  }

  addReplyEl.remove();

  if (isReplyFieldEmpty(addRelpyFieldEl, revelantObj.user.username)) {
    // Executed when the user clicks "REPLY" btn without writing anything or just reply-to username.

    revelantObj.isReplying = false;
  } else {
    // Executed when the user clicks "REPLY" btn and field isn't empty.
    const newReplyObj = createCommentReplyObj(
      appState,
      replyText,
      false,
      revelantObj
    );
    // console.log(appState);

    let replyWrapperEl = [...commentReplyWrapperEl.children].find(el =>
      el.classList.contains("reply-wrapper")
    );

    if (!replyWrapperEl) {
      replyWrapperEl = document.createElement("div");
      replyWrapperEl.classList.add("reply-wrapper");
      commentReplyWrapperEl.append(replyWrapperEl);
    }

    renderReplyEl(newReplyObj, replyWrapperEl, true, true, isScreenDesktop);

    showAddedCommentReply(replyWrapperEl.querySelectorAll(".comment-wrapper"));

    saveToLocalStorage(appState);

    revelantObj.isReplying = false;
  }
});

// Event listener to close reply and edit field when user clicks outside of them
document.body.addEventListener("click", function (e) {
  const allCommentReplyEls = getAllCommentReplyEls();

  const allReplies = getAllReplyObjs(appState.comments);
  const allCommentReplies = getAllCommentReplyObjs(
    appState.comments,
    allReplies
  );
  // console.log(allCommentReplies);

  const replyingObjs = allCommentReplies.filter(comment => comment.isReplying);

  const editingObjs = allCommentReplies.filter(comment => comment.isEditing);
  // console.log(replyingObjs, editingObjs);

  const replyingEls = replyingObjs.map(obj =>
    findElFromObj(allCommentReplyEls, obj)
  );

  const editingEls = editingObjs.map(obj =>
    findElFromObj(allCommentReplyEls, obj)
  );
  // console.log(replyingEls, editingEls);

  const clickedWrapper = e.target.closest(".comment-wrapper");

  if (replyingObjs.length > 0 && !replyingEls.includes(clickedWrapper)) {
    // Executing when some reply fields are opened & user clicks outside of reply fields.
    resetReplyingFields(replyingEls, replyingObjs);
  }
  if (editingObjs.length > 0 && !editingEls.includes(clickedWrapper)) {
    // Executing when some edit fields are opened & user clicks outside of edit fields.
    resetEditingFields(editingEls, editingObjs);
  }
});

// Event deligation for plus btns
containerEl.addEventListener("click", function (e) {
  const clickedEl = e.target;

  // Matching strategy
  if (!clickedEl.closest(".upvote-icon")) return;

  updateScore(true, clickedEl, appState);
});

// Event deligation for minus btns
containerEl.addEventListener("click", function (e) {
  const clickedEl = e.target;

  // Matching strategy
  if (!clickedEl.closest(".downvote-icon")) return;

  updateScore(false, clickedEl, appState);
});

// Event deligation for textarea fields when user starts typing after empty field error.
containerEl.addEventListener("input", function (e) {
  const fieldCahnged = e.target;

  // Matching strategy
  if (!fieldCahnged.classList.contains("add-comment-field")) return;

  const fieldWrapperEl = fieldCahnged.parentElement;

  // Hide show error el when user starts typing after empty field error.
  fieldWrapperEl.classList.remove("show-error");
});

// Timers
// Updating comment and reply posted time every 5 minutes automatically for ever.
setInterval(function () {
  const allEls = getAllCommentReplyEls();

  updateCommentsPostedTime(allEls, appState.comments);
}, FIVE_MINUTES_IN_MLS);
