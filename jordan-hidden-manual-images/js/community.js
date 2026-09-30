/* Jordan Hidden community flows. Firebase Auth/Firestore handles are supplied by auth.js; images are stored as HTTPS links in Firestore. */
(() => {
  let account = null;
  let admin = false;
  let loading = false;
  let lastError = "";
  let selectedJourneyId = null;
  let records = emptyRecords();
  let installed = false;
  let guestData = null;
  const communityScreens = ["food", "provider", "admin", "communityJourney", "communityPost"];
  const names = {
    food: "Local Food", provider: "My Services", admin: "Review",
    communityJourney: "Journey Memories", communityPost: "Travel Post",
  };
  function emptyRecords() {
    return { restaurants: [], services: [], requests: [], feedback: [], reviews: [],
      reports: [], journeys: [], questions: [], answers: [], photos: [] };
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }
  function requireAccount() {
    if (!account) throw new Error("Please sign in to continue.");
    return account;
  }
  function requireVisitor() {
    const current = requireAccount();
    if (current.role === "provider") throw new Error("This area is for tourists and visitors.");
    return current;
  }
  function currentSession() {
    return (selectedJourneyId && [S.activeQuest, ...S.completedQuests].find(
      item => item?.id === selectedJourneyId
    )) || S.activeQuest || S.completedQuests.at(-1) || null;
  }
  function sessionIdSafe(value) {
    if (!/^[A-Za-z0-9_-]{1,110}$/.test(value || "")) throw new Error("This journey needs a valid session ID.");
    return value;
  }
  function questPoints(session) {
    const done = session.tasks?.filter(Boolean).length || 0;
    return Math.min(done, session.completedAt ? TASKS.length - 1 : TASKS.length) * 20
      + (session.completedAt ? 200 : 0);
  }
  function journeySummary(raw) {
    const session = currentSession();
    if (!session) return null;
    const id = sessionIdSafe(session.id);
    const saved = records.journeys.find(item => item.id === id);
    const destination = G(session.destination);
    const journey = {
      ...saved, id, destination: session.destination,
      destinationName: destination?.n || session.destination,
      status: session.completedAt ? "completed" : "active",
      completedAt: session.completedAt || null,
      questXP: questPoints(session),
      quizXP: saved?.quizXP || 0,
      visited: (saved?.visitedPlaces || []).includes(session.destination),
    };
    const answers = records.answers.filter(item => item.journeyId === id);
    return { journey, answers, photos: records.photos.filter(item => item.journeyId === id),
      questions: records.questions.filter(item => item.destination === session.destination),
      feedback: records.feedback.find(item => item.journeyId === id),
      destinations: P.map(place => ({ id: place.id, name: place.n })),
      summary: {
        destination: journey.destinationName, xp: journey.questXP + journey.quizXP,
        questionsAnswered: answers.length, correctAnswers: answers.filter(item => item.correct).length,
        achievements: BD.filter(badge => U(badge[4])).map(badge => badge[1]),
        visitedPlaces: (journey.visitedPlaces || []).map(place => G(place)?.n || place),
      } };
  }
  function renderScreen(name) {
    if (!window.CommunityUI) return "<p>Community pages are loading.</p>";
    let html = "";
    let notice = "";
    const accountNotice = message => `<div class="card card-body community-preview-notice" role="note"><strong>${message}</strong>${!account ? ` <button class="btn sm" onclick="JordanHiddenRequireAccount('${name}')">Log in / Sign up</button>` : ""}</div>`;
    if (name === "food") {
      html = window.CommunityUI.food({
        restaurants: records.restaurants, services: records.services, loading,
      });
    } else if (name === "provider") {
      if (account?.role !== "provider") notice = accountNotice("Service submissions are available to service-provider accounts. You can explore this page without one.");
      html = window.CommunityUI.provider({ requests: account?.role === "provider" ? records.requests : [] });
    } else if (name === "admin") {
      if (!admin) notice = accountNotice("Review and moderation require administrator access. This is a preview without private records.");
      html = window.CommunityUI.admin({
        requests: admin ? records.requests : [], feedback: admin ? records.feedback : [],
        reviews: admin ? records.reviews : [], reports: admin ? records.reports : [],
        restaurants: admin ? records.restaurants : [], photos: admin ? records.photos : [],
      });
    } else if (name === "communityJourney" && account?.role !== "provider" && account) {
      const context = journeySummary();
      html = context
        ? window.CommunityUI.journey(context)
        : '<div class="card card-body">Start a quest to create a journey and capture memories.</div>';
    } else if (name === "communityPost" && account?.role !== "provider" && account) {
      const context = journeySummary();
      html = context?.journey.status === "completed"
        ? window.CommunityUI.post(context)
        : '<div class="card card-body">Finish this journey before creating its travel post.</div>';
    } else if (name === "communityJourney") {
      notice = accountNotice("Your journey memories are private to your account.");
      html = '<div class="community-preview-grid"><div class="card card-body"><h1>Journey Memories</h1><p>Save photos from the places you visited.</p></div><div class="card card-body"><h2>Destination questions</h2><p>Answer local questions during your quest.</p></div><div class="card card-body"><h2>Travel feedback</h2><p>Share feedback when your journey is complete.</p></div></div>';
    } else if (name === "communityPost") {
      notice = accountNotice("Your travel posts are created from your own completed journeys.");
      html = '<div class="community-preview-grid"><div class="card card-body"><h1>Travel Post</h1><p>Turn a completed journey into a post with your places, photos and achievements.</p></div><div class="card card-body"><h2>Your journey recap</h2><p>Your visited places and XP will appear here after you complete a quest.</p></div><div class="card card-body"><h2>Share your story</h2><p>Preview, share or download your travel post.</p></div></div>';
    } else {
      html = '<div class="card card-body">This section is not available for your account type.</div>';
    }
    return notice + (lastError ? `<p class="community-error" role="alert">${escapeHtml(lastError)}</p>` : "") + html;
  }
  function install() {
    if (installed) return;
    installed = true;
    for (const name of communityScreens) {
      V[name] = () => renderScreen(name);
      FR[name] = "Community_" + name;
    }
    const originalJourney = V.journey;
    V.journey = () => originalJourney() + (account?.role !== "provider"
      ? `<div class="community-cta card card-body"><h2>Keep your journey memories</h2><p class="text-muted">Save photos, answer a few destination questions, and create a travel post after your quest.</p><button class="btn" data-action="open-journey" data-id="${escapeHtml(S.activeQuest?.id || S.completedQuests.at(-1)?.id || "")}">Open current journey</button><div class="chips" style="margin-top:16px">${S.completedQuests.slice().reverse().map(q => `<button class="chip" data-action="open-journey" data-id="${escapeHtml(q.id)}">${escapeHtml(G(q.destination)?.n || q.destination)} memories</button>`).join("")}</div></div>`
      : "");
    const originalQuest = V.quest;
    V.quest = () => originalQuest() + (account?.role !== "provider"
      ? '<div class="community-cta"><button class="btn g" onclick="go(\'communityJourney\')">Photos & destination questions</button></div>'
      : "");
  }
  function setNavigation() {
    for (let index = NAV.length - 1; index >= 0; index--) {
      if (communityScreens.includes(NAV[index][0])) NAV.splice(index, 1);
    }
    for (const name of communityScreens) NAV.push([name, names[name]]);
    if (document.body.classList.contains("site-ready")) drawHd();
  }
  function showError(cause) {
    console.error("Community action failed", cause);
    lastError = cause?.message || "The request could not be completed.";
    toast(lastError);
    if (communityScreens.includes(S.s)) draw();
  }
  function rows(snapshot) {
    return snapshot.docs.map(item => ({ ...item.data(), id: item.id }));
  }
  async function refresh() {
    if (!account) return refreshPublic();
    const session = requireAccount();
    const { firestore: f, db } = session;
    loading = true;
    if (communityScreens.includes(S.s)) draw();
    try {
      const own = collection => f.query(f.collection(db, collection), f.where("ownerUid", "==", session.uid));
      const approved = collection => f.query(f.collection(db, collection), f.where("status", "==", "approved"));
      const tasks = {
        restaurants: approved("restaurants"), services: approved("approvedServices"),
        requests: admin ? f.collection(db, "serviceRequests") : own("serviceRequests"),
        feedback: admin ? f.collection(db, "feedback") : own("feedback"),
        reviews: admin ? f.collection(db, "reviews") : own("reviews"),
        reports: admin ? f.collection(db, "reports") : null,
        journeys: session.role !== "provider" ? own("journeys") : null,
        questions: session.role !== "provider"
          ? (admin ? f.collection(db, "journeyQuestions") : approved("journeyQuestions"))
          : null,
        answers: session.role !== "provider" ? own("journeyAnswers") : null,
        photos: admin ? f.collection(db, "touristPhotos")
          : session.role !== "provider" ? own("touristPhotos") : null,
      };
      const entries = await Promise.all(Object.entries(tasks).map(async ([key, query]) =>
        [key, query ? rows(await f.getDocs(query)) : []]));
      if (account !== session) return;
      const next = Object.fromEntries(entries);
      next.requests.forEach(request => {
        request.photos = Array.isArray(request.photos) ? request.photos.filter(Boolean) : [];
      });
      next.photos.forEach(photo => {
        photo.url = photo.imageUrl || photo.url || "";
      });
      records = next;
      lastError = "";
    } catch (cause) {
      if (account === session) {
        console.error("Community data load failed", cause);
        lastError = "Community data could not load. Check Firebase permissions and your connection.";
      }
    } finally {
      if (account === session) {
        loading = false;
        if (communityScreens.includes(S.s)) draw();
      }
    }
  }
  async function refreshPublic() {
    const source = guestData;
    if (!source) {
      lastError = "The public food directory is unavailable until Firebase is configured.";
      if (S.s === "food") draw();
      return;
    }
    loading = true;
    if (S.s === "food") draw();
    try {
      const { firestore: f, db } = source;
      const approved = name => f.query(f.collection(db, name), f.where("status", "==", "approved"));
      const [restaurants, services] = await Promise.all([
        f.getDocs(approved("restaurants")), f.getDocs(approved("approvedServices")),
      ]);
      if (account || guestData !== source) return;
      records.restaurants = rows(restaurants);
      records.services = rows(services);
      lastError = "";
    } catch (cause) {
      if (!account && guestData === source) {
        console.error("Public directory load failed", cause);
        lastError = "The public directory could not load. Check Firebase permissions and your connection.";
      }
    } finally {
      if (!account && guestData === source) {
        loading = false;
        if (S.s === "food") draw();
      }
    }
  }
  function fields(form, names) {
    return Object.fromEntries(names.map(name => [name, String(form.elements[name]?.value || "").trim()]));
  }
  function photoUrls(form) {
    const raw = String(form.elements.photos?.value || "").trim();
    const urls = raw.split(/\r?\n|,/).map(value => value.trim()).filter(Boolean);
    if (!urls.length) throw new Error("Add at least one image URL.");
    if (urls.length > 4) throw new Error("Add no more than four image URLs.");
    for (const value of urls) {
      let url;
      try { url = new URL(value); } catch (_) { throw new Error("Each image must use a valid HTTPS URL."); }
      if (url.protocol !== "https:") throw new Error("Each image must use a valid HTTPS URL.");
    }
    return urls;
  }
  async function ensureJourney(session = currentSession()) {
    const current = requireVisitor();
    if (!session) throw new Error("Start a quest before adding journey memories.");
    const id = sessionIdSafe(session.id);
    const { firestore: f, db } = current;
    const ref = f.doc(db, "journeys", id);
    await f.runTransaction(db, async transaction => {
      const saved = await transaction.get(ref);
      const questXP = questPoints(session);
      if (!saved.exists()) {
        transaction.set(ref, {
          ownerUid: current.uid, username: current.username, destination: session.destination,
          questId: id, startedAt: session.startedAt || new Date().toISOString(),
          completedAt: session.completedAt || null, status: session.completedAt ? "completed" : "active",
          questXP, quizXP: 0, questionsAnswered: 0, correctAnswers: 0,
          visitedPlaces: [], caption: "", createdAt: f.serverTimestamp(),
        });
      } else if (saved.data().ownerUid === current.uid) {
        transaction.update(ref, {
          questXP, completedAt: session.completedAt || saved.data().completedAt || null,
          status: session.completedAt ? "completed" : saved.data().status,
        });
      } else {
        throw new Error("This journey belongs to a different account.");
      }
    });
    return ref;
  }
  async function submitProvider(form) {
    const session = requireAccount();
    if (session.role !== "provider") throw new Error("Only service providers can submit a service.");
    const data = fields(form, ["name", "description", "location", "type", "availability", "contact", "additional"]);
    if (Object.entries(data).some(([key, value]) => key !== "additional" && !value))
      throw new Error("Complete the service details before submitting.");
    const photos = photoUrls(form);
    const { firestore: f, db } = session;
    const previousId = form.dataset.editId;
    const previous = records.requests.find(item => item.id === previousId);
    if (previousId && (!previous || previous.ownerUid !== session.uid || previous.status !== "needs_changes"))
      throw new Error("This submission is no longer open for revision.");
    const ref = previousId ? f.doc(db, "serviceRequests", previousId) : f.doc(f.collection(db, "serviceRequests"));
    const next = { ...data, status: "pending", photos };
    if (previousId) await f.updateDoc(ref, next);
    else await f.setDoc(ref, {
      ...next, ownerUid: session.uid, username: session.username, createdAt: f.serverTimestamp(),
    });
    form.reset();
    delete form.dataset.editId;
    toast("Your service is pending review.");
    await refresh();
  }
  async function submitRestaurant(form) {
    if (!admin) throw new Error("Only administrators can curate restaurants.");
    const session = requireAccount();
    const data = fields(form, ["name", "location", "description", "type", "dishes", "hours", "experience", "lat", "lng"]);
    if (Object.values(data).some(value => !value))
      throw new Error("Complete all restaurant details, including opening information and map coordinates.");
    const lat = Number(data.lat), lng = Number(data.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)
      throw new Error("Enter valid latitude and longitude.");
    const photos = photoUrls(form);
    const { firestore: f, db } = session;
    const ref = f.doc(f.collection(db, "restaurants"));
    await f.setDoc(ref, {
      name: data.name, location: data.location, description: data.description,
      type: data.type, dishes: data.dishes, hours: data.hours, experience: data.experience,
      lat, lng, photos,
      status: "approved", curatorUid: session.uid, createdAt: f.serverTimestamp(),
    });
    form.reset();
    toast("Curated restaurant published.");
    await refresh();
  }
  async function submitPhoto(form) {
    const session = requireVisitor();
    const photos = photoUrls(form);
    const journey = currentSession();
    await ensureJourney(journey);
    for (const imageUrl of photos) {
      await session.firestore.addDoc(session.firestore.collection(session.db, "touristPhotos"), {
        ownerUid: session.uid, journeyId: journey.id, destination: journey.destination,
        imageUrl, createdAt: session.firestore.serverTimestamp(),
      });
    }
    form.reset();
    toast("Photo saved to this journey.");
    await refresh();
  }
  async function answer(questionId, choice) {
    const session = requireVisitor();
    const journey = currentSession();
    if (!journey) throw new Error("Start a journey first.");
    const question = records.questions.find(item => item.id === questionId && item.destination === journey.destination);
    if (!question || !Number.isInteger(choice) || choice < 0 || choice >= question.options.length)
      throw new Error("This question is not available for your destination.");
    await ensureJourney(journey);
    await window.JordanHiddenFlush?.().catch(() => { throw new Error("Progress could not be saved. Try again."); });
    const { firestore: f, db } = session;
    const id = `${session.uid}_${journey.id}_${questionId}`;
    const answerRef = f.doc(db, "journeyAnswers", id);
    const journeyRef = f.doc(db, "journeys", journey.id);
    const userRef = f.doc(db, "users", session.uid);
    const result = await f.runTransaction(db, async transaction => {
      const [existing, profile] = await Promise.all([transaction.get(answerRef), transaction.get(userRef)]);
      if (existing.exists()) return { duplicate: true };
      if (!profile.exists()) throw new Error("User profile is missing.");
      const correct = choice === question.correctIndex;
      const xp = correct ? Number(question.xp || 15) : 0;
      transaction.set(answerRef, {
        ownerUid: session.uid, journeyId: journey.id, destination: journey.destination,
        questionId, choice, correct, awardedXP: xp, answeredAt: f.serverTimestamp(),
      });
      transaction.update(journeyRef, {
        questionsAnswered: f.increment(1), correctAnswers: f.increment(correct ? 1 : 0),
        quizXP: f.increment(xp),
      });
      if (xp) transaction.update(userRef, { "progress.xp": f.increment(xp) });
      return { correct, xp, totalXp: Number(profile.data().progress?.xp || 0) + xp };
    });
    if (result.duplicate) throw new Error("You have already answered this question for this journey.");
    if (result.xp) S.xp = result.totalXp;
    toast(result.correct ? `Correct! +${result.xp} XP` : "Answer recorded. Keep exploring!");
    await refresh();
  }
  async function submitFeedback(form) {
    const session = requireVisitor();
    const journey = currentSession();
    if (!journey?.completedAt) throw new Error("Finish the journey before submitting feedback.");
    await ensureJourney(journey);
    if (records.feedback.some(item => item.journeyId === journey.id))
      throw new Error("Feedback has already been submitted for this journey.");
    const values = fields(form, ["rating", "opinion", "liked", "disliked", "improve", "additions", "suggestions"]);
    const rating = Number(values.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !values.opinion)
      throw new Error("Select a rating and share your overall opinion.");
    const { firestore: f, db } = session;
    const batch = f.writeBatch(db);
    const feedbackId = `${session.uid}_${journey.id}`;
    batch.set(f.doc(db, "feedback", feedbackId), {
      ...values, rating, ownerUid: session.uid, username: session.username,
      journeyId: journey.id, destination: journey.destination, status: "pending",
      createdAt: f.serverTimestamp(),
    });
    batch.set(f.doc(db, "reviews", feedbackId), {
      ownerUid: session.uid, username: session.username, journeyId: journey.id,
      destination: journey.destination, rating, opinion: values.opinion,
      status: "pending", createdAt: f.serverTimestamp(),
    });
    await batch.commit();
    form.reset();
    toast("Your private feedback was sent to the team.");
    await refresh();
  }
  async function moderate(requestId, status) {
    if (!admin || !["approved", "rejected", "needs_changes"].includes(status))
      throw new Error("Administrator access is required.");
    const session = requireAccount();
    const request = records.requests.find(item => item.id === requestId);
    if (!request) throw new Error("This request could not be found.");
    const { firestore: f, db } = session;
    const note = document.getElementById(`admin-note-${requestId}`)?.value.trim() || "";
    const batch = f.writeBatch(db);
    batch.update(f.doc(db, "serviceRequests", requestId), { status, adminNote: note });
    const publishedRef = f.doc(db, "approvedServices", requestId);
    if (status === "approved") {
      const { name, description, location, type, availability, additional, photos } = request;
      if (!photos?.length) throw new Error("Add the provider photo links before approving.");
      batch.set(publishedRef, {
        sourceRequestId: requestId, ownerUid: request.ownerUid,
        name, description, location, type, availability, additional,
        photos,
        status: "approved", approvedAt: f.serverTimestamp(),
      });
    } else if (records.services.some(item => item.id === requestId)) batch.delete(publishedRef);
    await batch.commit();
    toast(`Service ${status === "needs_changes" ? "returned for changes" : status}.`);
    await refresh();
  }
  async function moderateRecord(action, id) {
    if (!admin) throw new Error("Administrator access is required.");
    const session = requireAccount();
    const changes = {
      "review-feedback": ["feedback", "reviewed"],
      "hide-feedback": ["feedback", "hidden"],
      "approve-review": ["reviews", "approved"],
      "hide-review": ["reviews", "rejected"],
      "resolve-report": ["reports", "resolved"],
      "dismiss-report": ["reports", "dismissed"],
    };
    if (action === "remove-photo") {
      const photo = records.photos.find(item => item.id === id);
      if (!photo) throw new Error("Photo not found.");
      if (!confirm("Permanently remove this uploaded photo?")) return;
      await session.firestore.deleteDoc(session.firestore.doc(session.db, "touristPhotos", id));
      toast("Photo link removed from Jordan Hidden.");
    } else {
      const [collection, status] = changes[action] || [];
      if (!collection || !records[collection].some(item => item.id === id))
        throw new Error("This item is no longer available for review.");
      await session.firestore.updateDoc(session.firestore.doc(session.db, collection, id), { status });
      toast("Moderation decision saved.");
    }
    await refresh();
  }
  async function seedQuestions() {
    if (!admin) throw new Error("Administrator access is required.");
    const session = requireAccount();
    const { firestore: f, db } = session;
    const batch = f.writeBatch(db);
    for (const [destination, questions] of Object.entries(window.JordanQuestions)) {
      questions.forEach(([prompt, options, correctIndex], index) => {
        batch.set(f.doc(db, "journeyQuestions", `${destination}-${index + 1}`),
          { destination, prompt, options, correctIndex, xp: 15, status: "approved" });
      });
    }
    await batch.commit();
    toast("Destination questions published.");
    await refresh();
  }
  async function markVisited(destination) {
    const session = requireVisitor();
    if (!G(destination)) throw new Error("Choose a valid place.");
    const ref = await ensureJourney();
    await session.firestore.updateDoc(ref, { visitedPlaces: session.firestore.arrayUnion(destination) });
    toast("Place added to this journey.");
    await refresh();
  }
  async function reportContent(button) {
    const session = requireAccount();
    const reason = prompt("What should the Jordan Hidden team review?");
    if (!reason?.trim()) return;
    await session.firestore.addDoc(session.firestore.collection(session.db, "reports"), {
      ownerUid: session.uid, username: session.username, targetId: button.dataset.id || "",
      reason: reason.trim().slice(0, 1000), status: "pending",
      createdAt: session.firestore.serverTimestamp(),
    });
    toast("Report sent privately to the team.");
  }
  async function saveCaption() {
    const session = requireVisitor();
    const journey = currentSession();
    if (!journey?.completedAt) throw new Error("Finish the journey before sharing.");
    const caption = String(document.getElementById("post-caption")?.value || "").trim().slice(0, 500);
    const ref = await ensureJourney(journey);
    await session.firestore.updateDoc(ref, { caption });
    return caption;
  }
  function postText(caption) {
    const context = journeySummary();
    if (!context) throw new Error("No journey found.");
    const s = context.summary;
    return [
      `${s.destination} — my Jordan Hidden journey`,
      caption, `${s.xp} journey XP · ${s.correctAnswers}/${s.questionsAnswered} quiz answers correct`,
      `Visited: ${s.visitedPlaces.join(", ") || s.destination}`,
      `Achievements: ${s.achievements.join(", ") || "Journey complete"}`,
    ].filter(Boolean).join("\n");
  }
  async function postImage(caption) {
    const context = journeySummary();
    if (!context || context.journey.status !== "completed")
      throw new Error("Finish your journey before creating a post.");
    const selected = [...document.querySelectorAll(".cu-post-photo-select:checked")];
    if (selected.length > 4) throw new Error("Select no more than four photos.");
    const chosen = selected.map(input => context.photos.find(photo => photo.id === input.value))
      .filter(Boolean);
    const canvas = document.createElement("canvas");
    canvas.width = 1080; canvas.height = 1600;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image export is not supported by this browser.");
    ctx.fillStyle = "#241D18"; ctx.fillRect(0, 0, 1080, 1600);
    ctx.fillStyle = "#C99A3D"; ctx.font = "bold 36px Georgia"; ctx.fillText("JORDAN HIDDEN", 70, 105);
    for (const [index, photo] of chosen.entries()) {
      const image = new Image();
      image.src = photo.url;
      await image.decode();
      const columns = chosen.length === 1 ? 1 : 2;
      const rows = Math.ceil(chosen.length / columns);
      const width = (940 - (columns - 1) * 16) / columns;
      const height = (690 - (rows - 1) * 16) / rows;
      const x = 70 + (index % columns) * (width + 16);
      const y = 155 + Math.floor(index / columns) * (height + 16);
      const scale = Math.max(width / image.width, height / image.height);
      const sw = width / scale, sh = height / scale;
      ctx.drawImage(image, (image.width - sw) / 2, (image.height - sh) / 2, sw, sh, x, y, width, height);
    }
    ctx.fillStyle = "#F4EBDD"; ctx.font = "bold 56px Georgia";
    ctx.fillText(context.summary.destination.slice(0, 30), 70, 930);
    ctx.font = "29px sans-serif";
    ctx.fillText(`${context.summary.xp} XP · ${context.summary.correctAnswers}/${context.summary.questionsAnswered} quiz answers correct`, 70, 995);
    ctx.font = "24px sans-serif";
    const lines = [
      `Visited: ${context.summary.visitedPlaces.join(", ") || context.summary.destination}`,
      `Achievements: ${context.summary.achievements.join(", ") || "Journey complete"}`,
      ...((caption.match(/.{1,65}(?:\s|$)/g) || []).map(line => line.trim())),
    ];
    lines.slice(0, 8).forEach((line, index) => ctx.fillText(line.slice(0, 70), 70, 1060 + index * 52));
    ctx.fillStyle = "#C99A3D"; ctx.fillText("Discover · Learn · Visit · Share", 70, 1530);
    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob(value => value ? resolve(value) : reject(new Error("Could not export the journey image.")), "image/png"));
    const name = `jordan-hidden-${context.journey.destination}.png`;
    return new File([blob], name, { type: "image/png" });
  }
  function downloadFile(file) {
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url; link.download = file.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  async function sharePost() {
    const caption = await saveCaption();
    const file = await postImage(caption);
    const text = postText(caption);
    if (navigator.canShare?.({ files: [file] }) && navigator.share) {
      await navigator.share({ title: "My Jordan journey", text, files: [file] });
    } else {
      downloadFile(file);
      try {
        await navigator.clipboard.writeText(text);
        toast("Image downloaded and story text copied for sharing.");
      } catch {
        toast("Image downloaded for sharing.");
      }
    }
    await refresh();
  }
  async function downloadPost() {
    const caption = await saveCaption();
    downloadFile(await postImage(caption));
    await refresh();
  }
  function showDetail(button) {
    const item = [...records.restaurants, ...records.services].find(row => row.id === button.dataset.id);
    if (!item) throw new Error("This approved place is no longer available.");
    const dialog = document.createElement("dialog");
    dialog.className = "community-dialog";
    const title = document.createElement("h2"); title.textContent = item.name;
    dialog.append(title);
    for (const label of ["location", "description", "type", "dishes", "hours", "experience", "availability", "contact", "additional"]) {
      if (!item[label]) continue;
      const paragraph = document.createElement("p");
      paragraph.textContent = `${label[0].toUpperCase() + label.slice(1)}: ${item[label]}`;
      dialog.append(paragraph);
    }
    for (const url of item.photos || []) {
      if (!/^https:\/\//i.test(url)) continue;
      const image = document.createElement("img");
      image.src = url; image.alt = item.name; image.loading = "lazy";
      dialog.append(image);
    }
    if (Number.isFinite(item.lat) && Number.isFinite(item.lng)) {
      const link = document.createElement("a");
      link.href = `https://www.openstreetmap.org/?mlat=${item.lat}&mlon=${item.lng}#map=16/${item.lat}/${item.lng}`;
      link.target = "_blank"; link.rel = "noopener noreferrer";
      link.textContent = "Open location on map"; dialog.append(link);
    }
    const close = document.createElement("button");
    close.className = "btn sm"; close.textContent = "Close"; close.onclick = () => dialog.close();
    dialog.append(close); document.body.append(dialog);
    dialog.addEventListener("close", () => dialog.remove(), { once: true });
    dialog.showModal();
  }
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action, id = button.dataset.id;
    if (!account && !["open-map", "service-detail", "restaurant-detail"].includes(action)) {
      window.JordanHiddenRequireAccount?.(S.s);
      return;
    }
    const task = async () => {
      if (action === "open-map") {
        const place = records.restaurants.find(row => row.id === id);
        if (!place || !Number.isFinite(place.lat) || !Number.isFinite(place.lng))
          throw new Error("Map coordinates are unavailable for this place.");
        window.open(`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=16/${place.lat}/${place.lng}`,
          "_blank", "noopener,noreferrer");
        return;
      }
      if (["service-detail", "restaurant-detail"].includes(action)) return showDetail(button);
      if (["approve", "reject", "needs-changes"].includes(action))
        return moderate(id, { approve: "approved", reject: "rejected", "needs-changes": "needs_changes" }[action]);
      if (["review-feedback", "hide-feedback", "approve-review", "hide-review",
        "resolve-report", "dismiss-report", "remove-photo"].includes(action))
        return moderateRecord(action, id);
      if (action === "seed-questions") return seedQuestions();
      if (action === "answer") return answer(id, Number(button.dataset.choice));
      if (action === "open-journey") {
        if (![S.activeQuest, ...S.completedQuests].some(item => item?.id === id))
          throw new Error("That journey could not be found.");
        selectedJourneyId = sessionIdSafe(id);
        return go("communityJourney");
      }
      if (action === "edit-request") {
        const request = records.requests.find(item => item.id === id);
        if (!request || request.ownerUid !== account.uid || request.status !== "needs_changes")
          throw new Error("This submission is no longer open for revision.");
        const form = document.getElementById("provider-form");
        if (!form) throw new Error("Open My Services to revise this submission.");
        for (const name of ["name", "description", "location", "type", "availability", "contact", "additional"])
          form.elements[name].value = request[name] || "";
        form.elements.photos.value = Array.isArray(request.photos) ? request.photos.join("\n") : "";
        form.dataset.editId = id;
        form.querySelector('button[type="submit"]').textContent = "Resubmit for review";
        form.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (action === "visited") return markVisited(id);
      if (action === "report") return reportContent(button);
      if (action === "show-post") return go("communityPost");
      if (action === "share-post") return sharePost();
      if (action === "download-post") return downloadPost();
    };
    button.disabled = true;
    Promise.resolve().then(task).catch(showError).finally(() => { button.disabled = false; });
  });
  document.addEventListener("submit", event => {
    const handlers = {
      "provider-form": submitProvider, "restaurant-form": submitRestaurant,
      "journey-photo-form": submitPhoto, "feedback-form": submitFeedback,
      "post-caption-form": async () => {
        await saveCaption();
        toast("Caption saved.");
        await refresh();
      },
    };
    const handler = handlers[event.target?.id];
    if (!handler) return;
    event.preventDefault();
    if (!account) {
      window.JordanHiddenRequireAccount?.(S.s);
      return;
    }
    const form = event.target;
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    handler(form).catch(showError).finally(() => { if (button) button.disabled = false; });
  });
  window.Community = {
    prepare: install,
    activateGuest(context) {
      install();
      account = null;
      admin = false;
      guestData = context;
      records = emptyRecords();
      lastError = "";
      setNavigation();
      if (S.s === "food") draw();
      if (context) refreshPublic();
    },
    async activate(context) {
      install();
      guestData = null;
      account = context;
      records = emptyRecords();
      lastError = "";
      selectedJourneyId = null;
      try {
        admin = (await context.firestore.getDoc(context.firestore.doc(context.db, "admins", context.uid))).exists();
      } catch (cause) {
        console.error("Admin access check failed", cause);
        admin = false;
        lastError = "Could not verify administrator access. Check your connection.";
      }
      setNavigation();
      if (communityScreens.includes(S.s)) draw();
      refresh();
    },
    deactivate() {
      account = null; admin = false; records = emptyRecords(); lastError = ""; loading = false;
      guestData = null;
      selectedJourneyId = null;
      if (installed) setNavigation();
    },
    questStarted(session) {
      if (account?.role !== "provider") {
        selectedJourneyId = session.id;
        ensureJourney(session).catch(showError);
      }
    },
    questCompleted(session) {
      if (account?.role !== "provider") ensureJourney(session).then(refresh).catch(showError);
    },
    refresh,
  };
})();