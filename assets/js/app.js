// After page loaded
// Data
const storage = localStorage.getItem("appData");
// console.log(storage);
let isScreenDesktop;

// DOM Elements
const addCommentEl = document.querySelector(
  ".container > .add-comment-wrapper"
);
const commentReplyWrapperEl = document.querySelector(".comment-reply-wrapper");

// Functions
/**
 * Fetches data from the provided URL and returns the parsed JSON data.
 *
 * @param {string} url - The URL to fetch data from.
 * @returns {Promise<any>} - A Promise with data form the URL..
 */
const getData = async function (url) {
  const res = await fetch(url);
  const data = await res.json();
  return data;
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
const hasSameUsernames = function (firstUsername, secondUsername) {
  return firstUsername === secondUsername;
};

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
 * Renders a comment element with the provided comment object and inserts it before the specified next element.
 *
 * @param {Object} commentObj - The comment object containing the data to be rendered.
 * @param {number} commentNum - The numerical identifier for the comment.
 * @param {HTMLElement} nextEL - The next element before which the comment should be inserted.
 */
const renderCommentEl = function (commentObj, commentNum, nextEL) {
  const commentHTML = `
        <div class="comment-reply-wrapper" data-counter="${commentNum}">
      <div class="comment-wrapper">
        <div class="comment">
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
          </div>
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
                <div class="comment-btn reply-btn">
                  <svg width="14" height="13" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M.227 4.316 5.04.16a.657.657 0 0 1 1.085.497v2.189c4.392.05 7.875.93 7.875 5.093 0 1.68-1.082 3.344-2.279 4.214-.373.272-.905-.07-.767-.51 1.24-3.964-.588-5.017-4.829-5.078v2.404c0 .566-.664.86-1.085.496L.227 5.31a.657.657 0 0 1 0-.993Z"
                      fill="#5357B6" />
                  </svg>
                  <span>Reply</span>
                </div>
              </div>
            </div>
            <div class="comment-detail-body">
              <p>
                ${commentObj.content}
              </p>
            </div>
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
const renderReplyEl = function (replyObj, parentEL) {
  const replyHTML = `<div class="comment-wrapper reply-comment-wrapper">
          <div class="comment">
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
            </div>
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
                  <div class="comment-btn reply-btn">
                    <svg width="14" height="13" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M.227 4.316 5.04.16a.657.657 0 0 1 1.085.497v2.189c4.392.05 7.875.93 7.875 5.093 0 1.68-1.082 3.344-2.279 4.214-.373.272-.905-.07-.767-.51 1.24-3.964-.588-5.017-4.829-5.078v2.404c0 .566-.664.86-1.085.496L.227 5.31a.657.657 0 0 1 0-.993Z"
                        fill="#5357B6" />
                    </svg>
                    <span>Reply</span>
                  </div>
                </div>
              </div>
              <div class="comment-detail-body">
                <p>
                  <span class="replied-username">@${
                    replyObj.replyingTo
                  }</span> ${replyObj.content}
                </p>
              </div>
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
const renderCommentsReplies = function (commentObjs) {
  commentObjs.forEach(commentObj => {
    let commentCounnter = 0;

    renderCommentEl(commentObj, commentCounnter, addCommentEl);

    // Checking if comment has any reply or not
    if (!hasCommentAnyReply(commentObj)) {
      commentCounnter++;
      return;
    }

    const commentReplyWrapperEl = document.querySelector(
      `.comment-reply-wrapper[data-counter="${commentCounnter}"]`
    );
    const repliesWrapperEl = document.createElement("div");
    repliesWrapperEl.classList.add("reply-wrapper");
    commentReplyWrapperEl.append(repliesWrapperEl);

    commentObj.replies.forEach(replyObj => {
      renderReplyEl(replyObj, repliesWrapperEl);

      commentCounnter++;
    });
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

  const commentWrapperEls = document.querySelectorAll(".comment-wrapper");

  commentWrapperEls.forEach(el => {
    const commentBtnEls = el.querySelectorAll(".comment-btn");
    const upvoteDownvoteEl = el.querySelector(".comment-upvote-downvote");
    const commentDetailEl = el.querySelector(".comment-detail");

    const detailFooterEl = document.createElement("div");
    detailFooterEl.innerHTML = "<div class='comment-btns'></div>";

    const btnsWrapper = detailFooterEl.querySelector(".comment-btns");

    detailFooterEl.classList.add("comment-detail-footer");
    commentDetailEl.append(detailFooterEl);

    detailFooterEl.prepend(upvoteDownvoteEl);
    commentBtnEls.forEach(btn => {
      btnsWrapper.append(btn);
    });
  });
};

// const init = function () {};

const appState = storage
  ? JSON.parse(storage)
  : await getData("http://127.0.0.1:5500/data.json");

// console.log(appState);

// Setting isReplying to false for all comments and replies
setPropFalse(appState.comments, "isReplying");
// console.log(appState);

// console.log(filterUserCommentsReplies(appState));

setPropFalse(filterUserCommentsReplies(appState).flat(), "isEditing");

// console.log(filterUserCommentsReplies(appState));

renderCommentsReplies(appState.comments);

setLayout();
