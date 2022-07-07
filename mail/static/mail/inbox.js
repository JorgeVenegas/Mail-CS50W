// Handle history state changes
window.onpopstate = (event) => {
  switch (event.state.view) {
    case "mailbox":
      load_mailbox(event.state.props);
      break;
    case "compose":
      compose_email();
      break;
    case "email":
      load_email(event.state.props);
      break;
    default:
      load_email("inbox");
      break;
  }
};

document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views and update history state
  document.querySelector("#inbox").addEventListener("click", () => {
    history.pushState({ view: "mailbox", props: "inbox" }, "", `/inbox`);
    load_mailbox("inbox");
  });
  document.querySelector("#sent").addEventListener("click", () => {
    history.pushState({ view: "mailbox", props: "sent" }, "", `/sent`);
    load_mailbox("sent");
  });
  document.querySelector("#archived").addEventListener("click", () => {
    history.pushState({ view: "mailbox", props: "archive" }, "", `/archive`);
    load_mailbox("archive");
  });
  document.querySelector("#compose").addEventListener("click", () => {
    history.pushState({ view: "compose" }, "", `/compose`);
    compose_email();
  });

  // By default, load the inbox
  load_mailbox("inbox");

  // Submit email form
  document
    .querySelector("#compose-form")
    .addEventListener("submit", (event) => send_email(event));
});

function compose_email(recipient = "", subject = "", body = "", focus = false) {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#email-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  if (!subject.startsWith("Re:")) {
    subject = `Re: ${subject}`;
  }

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = recipient;
  document.querySelector("#compose-subject").value = subject;
  document.querySelector("#compose-body").value = body;

  if (focus) {
    document.querySelector("#compose-body").focus();
  }
}

function load_email(id) {
  // Hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";

  // Delte buttonsn if previously created
  document.querySelector("#replyButton").innerHTML = "";
  document.querySelector("#archiveButton").innerHTML = "";

  // Get user email to validate further info
  let userEmail = document.querySelector("#userEmail").innerHTML;

  // Get email view from API response
  fetch(`/emails/${id}`)
    .then((response) => response.json())
    .then((emailInfo) => {
      if (userEmail !== emailInfo.sender) {
        // Fill email data to render
        document.querySelector("#sender").innerHTML = emailInfo.sender;
        document.querySelector("#recipients").innerHTML = emailInfo.recipients;
        document.querySelector("#subject").innerHTML = emailInfo.subject;
        document.querySelector("#timestamp").innerHTML = emailInfo.timestamp;
        document.querySelector("#mail-body").innerHTML = emailInfo.body;

        if (!emailInfo.read) {
          fetch(`/emails/${id}`, {
            method: "PUT",
            body: JSON.stringify({
              read: true,
            }),
          });
        }

        // Create reply and archive buttons with event listeners
        let replyButton = document.createElement("button");
        replyButton.classList.add("btn", "btn-sm", "btn-outline-primary");
        replyButton.setAttribute("id", "reply");
        replyButton.innerHTML = "Reply";
        document.querySelector("#replyButton").appendChild(replyButton);

        let replyBody = `On ${emailInfo.timestamp}, ${emailInfo.sender} wrote:\n\n${emailInfo.body}\n\n------------\n\n`;

        replyButton.addEventListener("click", () => {
          compose_email(emailInfo.sender, emailInfo.subject, replyBody, true);
        });

        let archiveButton = document.createElement("button");
        archiveButton.classList.add("btn", "btn-sm", "btn-outline-primary");
        archiveButton.setAttribute("id", "archieve");
        archiveButton.innerHTML = emailInfo.archived ? "Unarchive" : "Archive";
        document.querySelector("#archiveButton").appendChild(archiveButton);

        archiveButton.addEventListener("click", () => {
          fetch(`/emails/${this.id}`, {
            method: "PUT",
            body: JSON.stringify({
              archived: !emailInfo.archived,
            }),
          }).then(() => {
            let status = !emailInfo.archived ? "archived" : "unarchived";
            load_mailbox("inbox")(`Email ${status} succesfully.`);
          });
        });
      }
    })
    .then(
      () => (document.querySelector("#email-view").style.display = "block")
    );
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#email-view").style.display = "none";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      for (let email of emails) {
        // Create email card with event listener for each email.
        let card = document.createElement("div");
        card.classList.add("col-12", "card", "border-primary", "mb-3");
        card.setAttribute("tabindex", "0");
        card.setAttribute("id", `${email.id}`);
        card.addEventListener("click", () => {
          history.pushState(
            { view: "email", props: email.id },
            "",
            `/email/${email.id}`
          );
          load_email(email.id);
        });

        // Card body
        let cardBody = document.createElement("div");
        cardBody.classList.add("card-body", "row", "mx-0");

        // Sender
        let emailSenderCol = document.createElement("div");
        emailSenderCol.classList.add("col-4");

        let emailSender = document.createElement("strong");
        emailSender.classList.add("text-truncate", "text-primary");
        emailSender.innerHTML = email.sender;

        emailSenderCol.appendChild(emailSender);

        // Subject
        let emailSubjectCol = document.createElement("div");
        emailSubjectCol.classList.add("col-4");

        let emailSubject = document.createElement("span");
        emailSubject.classList.add("text-truncate");
        emailSubject.innerHTML = email.subject;

        emailSubjectCol.appendChild(emailSubject);

        // Date
        let emailDateCol = document.createElement("div");
        emailDateCol.classList.add("col-4", "d-flex", "justify-content-end");

        let emailDate = document.createElement("span");
        emailDate.classList.add("text-truncate");
        emailDate.innerHTML = email.timestamp;

        // Style card if already read
        if (email.read) {
          card.classList.add("text-bg-light");
          card.classList.remove("border-primary");
          card.classList.add("border-light");
          emailSender.classList.remove("text-primary");
        }

        // Append to card body and card
        emailDateCol.appendChild(emailDate);

        cardBody.appendChild(emailSenderCol);
        cardBody.appendChild(emailSubjectCol);
        cardBody.appendChild(emailDateCol);

        card.appendChild(cardBody);

        document.querySelector("#emails-view").appendChild(card);
      }
    });

  // Curried function to send message on mailbox loading (only if neede)
  return function load_message(message) {
    // Create alert with close button and dismissible capabilities
    let alert = document.createElement("div");
    alert.className = "alert";
    alert.classList.add("alert-primary", "alert-dismissible");
    alert.setAttribute("role", "alert");

    let closeButton = document.createElement("span");
    closeButton.type = "button";
    closeButton.className = "btn-close";
    closeButton.setAttribute("data-bs-dismiss", "alert");
    closeButton.setAttribute("aria-label", "Close");

    let messageDiv = document.createElement("div");
    messageDiv.innerHTML = message;

    alert.appendChild(messageDiv);
    alert.appendChild(closeButton);

    document.querySelector("#emails-view").appendChild(alert);
  };
}

function send_email(event) {
  // Get email information and store it on variables

  event.preventDefault();
  let recipients = document.querySelector("#compose-recipients").value;
  let subject = document.querySelector("#compose-subject").value;
  let body = document.querySelector("#compose-body").value;

  // Post request to send email for verification
  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      let alert = document.querySelector("#email-sent-alert");
      alert.style.display = "block";
      alert.className = "alert";
      if (result.error) {
        alert.classList.add("alert-danger");
        alert.innerHTML = result.error;
      } else {
        load_mailbox("sent")(result.message);
      }
    });
}
