/* Jordan Hidden community views. Classic script; markup only, no data access or event binding. */
(function () {
  'use strict';

  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const list = value => Array.isArray(value) ? value : [];
  const obj = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const text = (value, fallback = '') => value == null || value === '' ? fallback : esc(value);
  const attr = value => esc(value);
  const imageUrl = value => {
    const candidate = typeof value === 'string' ? value : obj(value).url || obj(value).src || obj(value).downloadURL;
    if (typeof candidate !== 'string') return '';
    try {
      const url = new URL(candidate);
      const secureRemote = url.protocol === 'https:' && url.hostname && !url.username && !url.password;
      const localBlob = url.protocol === 'blob:' && url.origin !== 'null' &&
        url.origin === window.location?.origin;
      return secureRemote || localBlob ? esc(url.href) : '';
    } catch (_) { return ''; }
  };
  const imageList = value => list(value).map(imageUrl).filter(Boolean);
  const imageSources = item => imageList(item.photos || item.images || (item.photoUrl ? [item.photoUrl] : []));
  const idOf = item => obj(item).id || obj(item).requestId || '';
  const action = (name, id, label, style = 'cu-outline', extra = '') =>
    `<button type="button" class="cu-button ${style}" data-action="${attr(name)}" data-id="${attr(id)}"${extra}>${esc(label)}</button>`;
  const status = value => {
    const raw = String(value || 'pending').toLowerCase();
    const allowed = ['approved', 'published', 'pending', 'in-review', 'needs_changes', 'rejected', 'reviewed', 'hidden', 'resolved', 'dismissed', 'uploaded'];
    const className = allowed.includes(raw) ? raw : 'pending';
    return `<span class="cu-status cu-status--${className}">${esc(raw.replace(/[-_]/g, ' '))}</span>`;
  };
  const media = item => {
    const url = imageSources(item)[0];
    return `<div class="cu-card-media">${url ? `<img src="${url}" alt="${attr(obj(item).name || obj(item).title || 'Community experience')}" loading="lazy">` : `<div class="cu-media-blank"><span>Jordan, together.</span></div>`}</div>`;
  };
  const photos = value => {
    const urls = imageList(value);
    return urls.length ? `<div class="cu-photo-strip">${urls.map((url, i) => `<img src="${url}" alt="Journey photo ${i + 1}" loading="lazy">`).join('')}</div>` : '';
  };
  const empty = (title, message) => `<div class="cu-empty"><h3>${esc(title)}</h3><p>${esc(message)}</p></div>`;
  const section = (title, subtitle, content) =>
    `<section class="cu-section"><div class="cu-section-head"><div><h2>${esc(title)}</h2>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div></div>${content}</section>`;
  const hero = (kicker, title, description) =>
    `<div class="cu-hero"><div class="cu-kicker">${esc(kicker)}</div><h1>${esc(title)}</h1><p>${esc(description)}</p></div>`;
  const wrap = content => `<div class="community-ui">${content}</div>`;
  const field = (form, key, label, opts = {}) => {
    const id = `${form}-${key}`;
    const required = opts.required ? ' required' : '';
    const hint = opts.hint ? `<small>${esc(opts.hint)}</small>` : '';
    const common = `id="${attr(id)}" name="${attr(key)}"${required}`;
    let control;
    if (opts.options) {
      control = `<select ${common}>${opts.options.map(option => `<option value="${attr(option)}">${esc(option)}</option>`).join('')}</select>`;
    } else if (opts.textarea) {
      control = `<textarea ${common} rows="${opts.rows || 3}"${opts.maxlength ? ` maxlength="${opts.maxlength}"` : ''}></textarea>`;
    } else {
      control = `<input ${common} type="${opts.type || 'text'}"${opts.type === 'file' ? ' accept="image/*" multiple' : ''}${opts.min ? ` min="${opts.min}"` : ''}${opts.max ? ` max="${opts.max}"` : ''}${opts.step ? ` step="${opts.step}"` : ''}>`;
    }
    return `<label class="cu-field" for="${attr(id)}"><span>${esc(label)}</span>${control}${hint}</label>`;
  };
  const approved = item => String(obj(item).status || '').toLowerCase() === 'approved';
  const restaurantCard = item => {
    const x = obj(item), id = idOf(x);
    return `<article class="cu-card">${media(x)}<div class="cu-card-body"><div class="cu-eyeline"><span class="cu-kicker">Local table</span>${status('approved')}</div><h3>${text(x.name, 'Local restaurant')}</h3><div class="cu-meta"><span>${text(x.location)}</span>${x.type ? `<span>${text(x.type)}</span>` : ''}</div><p>${text(x.description)}</p><div class="cu-actions">${action('restaurant-detail', id, 'Explore restaurant', 'cu-gold')}${x.lat != null && x.lng != null ? action('open-map', id, 'Open map') : ''}</div></div></article>`;
  };
  const serviceCard = item => {
    const x = obj(item), id = idOf(x);
    return `<article class="cu-card">${media(x)}<div class="cu-card-body"><div class="cu-eyeline"><span class="cu-kicker">Community experience</span>${status('approved')}</div><h3>${text(x.name, 'Local experience')}</h3><div class="cu-meta"><span>${text(x.location)}</span>${x.type ? `<span>${text(x.type)}</span>` : ''}</div><p>${text(x.description)}</p><div class="cu-actions">${action('service-detail', id, 'Explore experience', 'cu-gold')}</div></div></article>`;
  };

  function food({ restaurants, services, loading } = {}) {
    const places = list(restaurants).filter(approved);
    const experiences = list(services).filter(approved);
    return wrap(hero('The local side of Jordan', 'Come hungry. Leave connected.', 'Find places to eat and experiences hosted by the people who call Jordan home.') +
      (loading ? `<div class="cu-grid"><div class="cu-skeleton" aria-label="Loading restaurants"></div><div class="cu-skeleton" aria-label="Loading experiences"></div></div>` :
        section('Around the table', 'Approved local restaurants and food spots.', places.length ? `<div class="cu-grid cu-grid-wide">${places.map(restaurantCard).join('')}</div>` : empty('The table is being set', 'Approved restaurants will appear here as they join the community.')) +
        section('With local hosts', 'Small experiences, shared stories.', experiences.length ? `<div class="cu-grid cu-grid-wide">${experiences.map(serviceCard).join('')}</div>` : empty('More stories are on their way', 'Approved community experiences will appear here.'))));
  }

  function provider({ requests } = {}) {
    const submitted = list(requests);
    const providerForm = `<form id="provider-form" class="cu-form" enctype="multipart/form-data">
      <div class="cu-form-grid">${field('provider', 'name', 'Experience name', { required: true })}${field('provider', 'location', 'Location', { required: true })}</div>
      ${field('provider', 'description', 'What will guests experience?', { textarea: true, required: true })}
      <div class="cu-form-grid">${field('provider', 'type', 'Experience type', { required: true })}${field('provider', 'availability', 'Availability', { required: true })}</div>
      ${field('provider', 'contact', 'Contact details', { required: true, hint: 'Shared with the review team, not shown publicly.' })}
      ${field('provider', 'additional', 'Anything else we should know?', { textarea: true })}
      ${field('provider', 'photos', 'Photo URLs', { textarea: true, required: true, hint: 'Paste up to 4 HTTPS image links, one per line.' })}
      <div class="cu-form-foot"><p>Submissions remain private while our team reviews them.</p><button class="cu-button cu-gold" type="submit">Send experience for review</button></div>
    </form>`;
    const cards = submitted.map(raw => {
      const x = obj(raw);
      const note = x.adminNote || x.note;
      return `<article class="cu-panel cu-request"><div class="cu-request-head"><div><div class="cu-kicker">${text(x.kind || x.category || x.submissionType, 'Submission')}</div><h3>${text(x.name || x.title, 'Untitled submission')}</h3></div>${status(x.status)}</div><p class="cu-muted">${text(x.location)}</p>${note ? `<div class="cu-note"><strong>Review note:</strong> ${text(note)}</div>` : ''}<p>${text(x.description)}</p>${x.status === 'needs_changes' ? `<div class="cu-actions">${action('edit-request', x.id, 'Revise & resubmit', 'cu-gold')}</div>` : ''}</article>`;
    }).join('');
    return wrap(hero('For local hosts', 'Share your Jordan.', 'Bring your workshop, trail, or gathering to travelers looking for a genuine connection.') +
      `<div class="cu-notice">Your submissions are visible only to you and the review team until approved.</div>` +
      section('Your submissions', 'Follow each request from review to publication.', submitted.length ? `<div class="cu-grid">${cards}</div>` : empty('Your story starts here', 'Submit an experience below. You can follow its review status here.')) +
      section('Offer an experience', 'Tell us what guests will do, and who they will meet.', `<div class="cu-panel">${providerForm}</div>`));
  }

  function admin({ requests, feedback, reviews, reports, restaurants, photos: uploadedPhotos } = {}) {
    const queue = list(requests).map(x => ({ ...obj(x), _kind: obj(x).kind || 'Experience' }));
    const restaurantForm = `<form id="restaurant-form" class="cu-form" enctype="multipart/form-data">
      <div class="cu-form-grid">${field('restaurant', 'name', 'Restaurant name', { required: true })}${field('restaurant', 'location', 'Location', { required: true })}</div>
      ${field('restaurant', 'description', 'Tell us about this place', { textarea: true, required: true })}
      <div class="cu-form-grid">${field('restaurant', 'type', 'Cuisine or type', { required: true })}${field('restaurant', 'hours', 'Opening hours', { required: true })}</div>
      ${field('restaurant', 'dishes', 'Signature dishes', { textarea: true, required: true })}
      ${field('restaurant', 'experience', 'What makes the visit special?', { textarea: true, required: true })}
      <div class="cu-form-grid">${field('restaurant', 'lat', 'Latitude', { type: 'number', min: '-90', max: '90', step: 'any', required: true })}${field('restaurant', 'lng', 'Longitude', { type: 'number', min: '-180', max: '180', step: 'any', required: true })}</div>
      ${field('restaurant', 'photos', 'Photo URLs', { textarea: true, required: true, hint: 'Paste up to 4 HTTPS image links, one per line.' })}
      <div class="cu-form-foot"><p>Admin-curated listings appear in Food after they are approved.</p><button class="cu-button cu-gold" type="submit">Add curated restaurant</button></div>
    </form>`;
    const queueMarkup = queue.map(raw => {
      const x = obj(raw), id = idOf(x), noteId = `admin-note-${id}`;
      return `<article class="cu-panel cu-request"><div class="cu-request-head"><div><div class="cu-kicker">${text(x._kind)}</div><h3>${text(x.name || x.title, 'Untitled submission')}</h3><div class="cu-meta">${text(x.location)}${x.type ? ` · ${text(x.type)}` : ''}</div></div>${status(x.status)}</div>
        <p>${text(x.description)}</p>${x.contact ? `<div class="cu-note"><strong>Provider contact:</strong> ${text(x.contact)}</div>` : ''}
        ${x.availability ? `<p class="cu-muted"><strong>Availability:</strong> ${text(x.availability)}</p>` : ''}
        ${x.dishes ? `<p class="cu-muted"><strong>Dishes:</strong> ${text(x.dishes)}</p>` : ''}
        ${x.additional ? `<p class="cu-muted"><strong>Additional details:</strong> ${text(x.additional)}</p>` : ''}
        ${photos(x.photos || x.images)}
        <label class="cu-field" for="${attr(noteId)}"><span>Review note to provider</span><textarea id="${attr(noteId)}" name="adminNote" rows="2">${text(x.adminNote || x.note)}</textarea></label>
        <div class="cu-actions">${action('approve', id, 'Approve', 'cu-gold')}${action('needs-changes', id, 'Request changes')}${action('reject', id, 'Reject', 'cu-quiet')}</div></article>`;
    }).join('');
    const feedbackMarkup = list(feedback).map(raw => {
      const x = obj(raw), id = idOf(x);
      return `<article class="cu-panel"><div class="cu-eyeline"><span class="cu-kicker">Journey feedback</span>${status(x.status)}</div><div class="cu-meta"><span>Destination: ${text(x.destinationName || x.destination, 'Not specified')}</span><span>Owner: ${text(x.ownerUid || x.userId || x.uid, 'Not specified')}</span>${x.rating != null ? `<span>Rating: ${text(x.rating)} / 5</span>` : ''}</div><p>${text(x.opinion || x.comment, 'No written opinion.')}</p><div class="cu-meta">${x.liked ? `<span>Liked: ${text(x.liked)}</span>` : ''}${x.disliked ? `<span>Could improve: ${text(x.disliked)}</span>` : ''}</div>${x.improve || x.additions || x.suggestions ? `<div class="cu-note">${text([x.improve, x.additions, x.suggestions].filter(Boolean).join(' · '))}</div>` : ''}<div class="cu-actions">${action('review-feedback', id, 'Mark reviewed', 'cu-gold')}${action('hide-feedback', id, 'Hide feedback', 'cu-quiet')}</div></article>`;
    }).join('');
    const reviewMarkup = list(reviews).map(raw => {
      const x = obj(raw), id = idOf(x);
      return `<article class="cu-panel"><div class="cu-eyeline"><span class="cu-kicker">Traveler review</span>${status(x.status)}</div><h3>${text(x.name || x.destinationName || x.destination, 'Community experience')}</h3><div class="cu-meta"><span>Destination: ${text(x.destinationName || x.destination, 'Not specified')}</span><span>Owner: ${text(x.ownerUid || x.userId || x.uid, 'Not specified')}</span>${x.rating != null ? `<span>Rating: ${text(x.rating)} / 5</span>` : ''}</div><p>${text(x.comment || x.opinion || x.text)}</p><div class="cu-actions">${action('approve-review', id, 'Approve review', 'cu-gold')}${action('hide-review', id, 'Hide review', 'cu-quiet')}</div></article>`;
    }).join('');
    const reportMarkup = list(reports).map(raw => {
      const x = obj(raw), id = idOf(x);
      return `<article class="cu-panel"><div class="cu-eyeline"><span class="cu-kicker">Reported content</span>${status(x.status)}</div><h3>${text(x.destinationName || x.destination || x.subject, 'Community report')}</h3><div class="cu-meta"><span>Destination: ${text(x.destinationName || x.destination, 'Not specified')}</span><span>Owner: ${text(x.ownerUid || x.userId || x.uid, 'Not specified')}</span>${x.type || x.category ? `<span>${text(x.type || x.category)}</span>` : ''}</div><p>${text(x.reason || x.description || x.message)}</p><div class="cu-actions">${action('resolve-report', id, 'Resolve report', 'cu-gold')}${action('dismiss-report', id, 'Dismiss report', 'cu-quiet')}</div></article>`;
    }).join('');
    const photoMarkup = list(uploadedPhotos).map(raw => {
      const x = obj(raw), id = idOf(x), url = imageUrl(x);
      return `<article class="cu-panel cu-admin-photo">${url ? `<img class="cu-admin-photo-image" src="${url}" alt="Journey photo for ${attr(x.destinationName || x.destination || 'Jordan')}" loading="lazy">` : `<div class="cu-admin-photo-fallback">Image unavailable</div>`}<div class="cu-eyeline"><span class="cu-kicker">Journey photo</span>${status(x.status || 'uploaded')}</div><div class="cu-meta"><span>Destination: ${text(x.destinationName || x.destination, 'Not specified')}</span><span>Owner: ${text(x.ownerUid || x.userId || x.uid, 'Not specified')}</span></div><div class="cu-actions">${action('remove-photo', id, 'Remove photo', 'cu-quiet')}</div></article>`;
    }).join('');
    return wrap(hero('Community review', 'Keep the good stories honest.', 'Review submissions and listen to traveler feedback before experiences reach the wider community.') +
      `<div class="cu-notice">Provider contact details, review notes, and unapproved submissions are private to this review space.</div>` +
      section('Submission queue', `${queue.length} submission${queue.length === 1 ? '' : 's'} to review.`, queue.length ? `<div class="cu-stack">${queueMarkup}</div>` : empty('All caught up', 'New provider submissions will appear here.')) +
      section('Curate a restaurant', 'Add a vetted local table to Food.', `<div class="cu-panel">${restaurantForm}</div>`) +
      section('Destination questions', 'Prepare questions for travelers to answer.', `<div class="cu-panel"><p class="cu-muted">Seed the destination question bank from the review desk.</p><div class="cu-actions">${action('seed-questions', '', 'Seed destination questions', 'cu-gold')}</div></div>`) +
      section('Curated restaurants', '', list(restaurants).length ? `<div class="cu-grid">${list(restaurants).map(restaurant => {
        const r = obj(restaurant);
        return `<article class="cu-panel"><div class="cu-eyeline"><h3>${text(r.name, 'Restaurant')}</h3>${status(r.status)}</div><p class="cu-muted">${text(r.location)}</p></article>`;
      }).join('')}</div>` : empty('No curated restaurants yet', 'Restaurants added by the review team will appear here.')) +
      section('Journey photos', 'Private moderation view of traveler uploads.', photoMarkup ? `<div class="cu-grid cu-grid-wide">${photoMarkup}</div>` : empty('No journey photos yet', 'Saved traveler photo links will appear here for review.')) +
      section('Traveler feedback', '', feedbackMarkup ? `<div class="cu-grid">${feedbackMarkup}</div>` : empty('No feedback yet', 'Journey feedback will show here once travelers share it.')) +
      section('Reviews', '', reviewMarkup ? `<div class="cu-grid">${reviewMarkup}</div>` : empty('No reviews yet', 'Community reviews will appear here.')) +
      section('Reports', '', reportMarkup ? `<div class="cu-grid">${reportMarkup}</div>` : empty('No reports', 'There are no traveler reports to review.')));
  }

  function journey({ journey: journeyData, photos: journeyPhotos, questions, answers, feedback, destinations } = {}) {
    const j = obj(journeyData), destinationItems = list(destinations);
    const selectedId = j.destinationId || j.destination || '';
    const destination = destinationItems.find(item => String(idOf(item) || obj(item).slug) === String(selectedId)) || {};
    const title = j.destinationName || obj(destination).name || j.name || 'Your Jordan journey';
    const savedPhotos = list(journeyPhotos);
    const responseList = list(answers);
    const answerFor = questionId => responseList.find(answer => String(obj(answer).questionId) === String(questionId));
    const questionMarkup = list(questions).map((raw, index) => {
      const q = obj(raw), qid = idOf(q) || String(index), chosen = obj(answerFor(qid));
      const choices = list(q.choices || q.options);
      return `<article class="cu-panel"><div class="cu-eyeline"><span class="cu-kicker">Question ${index + 1}</span>${chosen.choice != null || chosen.choiceIndex != null ? '<span class="cu-status cu-status--approved">Answered</span>' : ''}</div><h3>${text(q.question || q.prompt || q.text, 'Your question')}</h3><div class="cu-choice-list">${choices.map((option, i) => {
        const label = typeof option === 'string' ? option : obj(option).text || obj(option).label || '';
        const selected = Number(chosen.choice != null ? chosen.choice : chosen.choiceIndex) === i && (chosen.choice != null || chosen.choiceIndex != null);
        return action('answer', qid, label, 'cu-outline', ` data-choice="${i}" aria-pressed="${selected}"`);
      }).join('')}</div></article>`;
    }).join('');
    const feedbackDone = feedback != null && Object.keys(obj(feedback)).length > 0;
    const feedbackForm = `<form id="feedback-form" class="cu-form">
      <div class="cu-form-grid">${field('feedback', 'rating', 'Your rating, 1 to 5', { type: 'number', min: '1', max: '5', step: '1', required: true })}${field('feedback', 'opinion', 'Your overall impression', { textarea: true, required: true })}</div>
      <div class="cu-form-grid">${field('feedback', 'liked', 'What did you love?', { textarea: true })}${field('feedback', 'disliked', 'What did not work?', { textarea: true })}</div>
      ${field('feedback', 'improve', 'What could be improved?', { textarea: true })}
      <div class="cu-form-grid">${field('feedback', 'additions', 'What would you add?', { textarea: true })}${field('feedback', 'suggestions', 'Other suggestions', { textarea: true })}</div>
      <div class="cu-form-foot"><p>Help make the next journey better for everyone.</p><button class="cu-button cu-gold" type="submit">Send feedback</button></div>
    </form>`;
    return wrap(hero('A place for the moments', title, 'Keep the places, photographs, and small discoveries that made this destination yours.') +
      `<div class="cu-statline"><span>${savedPhotos.length} photo${savedPhotos.length === 1 ? '' : 's'}</span><span>${responseList.length} answer${responseList.length === 1 ? '' : 's'}</span>${feedbackDone ? '<span>Feedback shared</span>' : ''}</div>` +
      section('Your photographs', 'Only you decide what to keep and share.', `<div class="cu-panel">${photos(savedPhotos) || `<p class="cu-muted">No photos saved for this destination yet.</p>`}<hr class="cu-divider"><form id="journey-photo-form" class="cu-form">${field('journey-photo', 'photos', 'Journey photo URLs', { textarea: true, required: true, hint: 'Paste up to 4 HTTPS image links, one per line.' })}<div class="cu-actions"><button type="submit" class="cu-button cu-gold">Save photo links</button></div></form></div>`) +
      section('A few things to remember', 'Choose an answer for each destination question.', `<div class="cu-stack">${questionMarkup || empty('Questions are coming', 'There are no questions for this destination yet.')}</div>`) +
      section('Tell us how it went', 'Your perspective helps local hosts and future travelers.', feedbackDone
        ? `<div class="cu-notice" role="status">Feedback submitted. Thank you for sharing your journey.</div>`
        : j.status === 'completed'
          ? `<div class="cu-panel">${feedbackForm}</div>`
          : `<div class="cu-empty"><h3>Finish your journey first</h3><p>Feedback opens after this destination journey is completed.</p></div>`) +
      `<div class="cu-actions">${action('visited', selectedId, j.visited ? 'Visited' : 'Mark as visited', 'cu-outline', j.visited ? ' aria-pressed="true"' : ' aria-pressed="false"')}${action('show-post', idOf(j) || selectedId, 'View journey post', 'cu-gold')}${action('report', selectedId, 'Report an issue', 'cu-quiet')}</div>`);
  }

  function post({ journey: journeyData, photos: journeyPhotos, summary } = {}) {
    const j = obj(journeyData), s = obj(summary), id = idOf(j) || j.destinationId || j.destination || '';
    const destination = j.destinationName || s.destinationName || (typeof s.destination === 'string' ? s.destination : obj(s.destination).name) || j.name || 'A Jordan journey';
    const title = destination;
    const count = list(journeyPhotos).length;
    const value = x => x == null ? '—' : text(x);
    const named = item => typeof item === 'string' || typeof item === 'number' ? item : obj(item).name || obj(item).title || obj(item).destinationName || obj(item).label || '';
    const record = (items, emptyLabel) => Array.isArray(items)
      ? items.length ? `<ul class="cu-recap-list">${items.map(item => `<li>${text(named(item))}</li>`).join('')}</ul>` : `<span class="cu-muted">${esc(emptyLabel)}</span>`
      : items == null ? `<span class="cu-muted">${esc(emptyLabel)}</span>` : `<span>${text(items)}</span>`;
    const caption = j.caption || s.caption;
    const selectablePhotos = list(journeyPhotos).length ? `<div class="cu-post-photo-picker"><div class="cu-kicker">Photos for your post</div><p class="cu-muted" style="font-size:12px;margin-bottom:12px">Choose up to 4 photos. The first four are selected to start.</p><div class="cu-photo-strip">${list(journeyPhotos).map((raw, i) => {
      const photo = obj(raw), url = imageUrl(photo), photoId = photo.id || '';
      return `<label class="cu-post-photo-option" style="display:grid;gap:8px;cursor:pointer">${url ? `<img src="${url}" alt="Journey photo ${i + 1}" loading="lazy">` : `<span class="cu-admin-photo-fallback">Image unavailable</span>`}<span style="display:flex;align-items:center;gap:7px;font-size:12px"><input type="checkbox" class="cu-post-photo-select" value="${attr(photoId)}"${i < 4 ? ' checked' : ''}> Include photo ${i + 1}</span></label>`;
    }).join('')}</div></div>` : '';
    return wrap(hero('Your journey, in your words', title, 'A small record of the places you went and what stayed with you.') +
      `<div class="cu-split"><article class="cu-panel"><div class="cu-kicker">Journey notes</div><h3>${text(s.title || title)}</h3>
      ${s.text || s.description || typeof summary === 'string' ? `<p>${text(typeof summary === 'string' ? summary : s.text || s.description)}</p>` : ''}
      <div class="cu-recap"><div class="cu-recap-item"><span>Destination</span><strong>${text(destination)}</strong></div><div class="cu-recap-item"><span>XP earned</span><strong>${value(s.xp)}</strong></div><div class="cu-recap-item"><span>Questions answered</span><strong>${value(s.questionsAnswered)}</strong></div><div class="cu-recap-item"><span>Correct answers</span><strong>${value(s.correctAnswers)}</strong></div></div>
      <div class="cu-recap-details"><div><h4>Achievements</h4>${record(s.achievements, 'No achievements recorded yet.')}</div><div><h4>Places visited</h4>${record(s.visitedPlaces, 'No places recorded yet.')}</div></div>
      <div class="cu-caption"><div class="cu-kicker">Your caption</div><p>${caption ? text(caption) : '<span class="cu-muted">Add a caption to tell the story behind these moments.</span>'}</p></div>
      ${selectablePhotos}${!count ? `<p class="cu-muted">Photos saved to this destination will appear here.</p>` : ''}<div class="cu-statline"><span>${count} photo${count === 1 ? '' : 's'}</span></div></article>
      <aside class="cu-panel"><h3>Make it yours</h3><form id="post-caption-form" class="cu-form"><label class="cu-field" for="post-caption"><span>Caption</span><textarea id="post-caption" name="caption" rows="6" maxlength="1200">${text(caption)}</textarea></label><button class="cu-button cu-gold" type="submit">Save caption</button></form><hr class="cu-divider"><div class="cu-actions">${action('share-post', id, 'Share post')}${action('download-post', id, 'Download post', 'cu-outline')}</div><p class="cu-muted" style="font-size:12px;margin-top:14px">Share only what you are comfortable making public.</p></aside></div>`);
  }

  // Optional detail dialog markup; caller controls insertion, opening, and dismissal.
  function detail({ title, description, item, type } = {}) {
    const x = obj(item), id = idOf(x);
    const target = type === 'restaurant' ? 'restaurant-detail' : 'service-detail';
    return wrap(`<div class="cu-detail" role="dialog" aria-modal="true" aria-label="${attr(title || x.name || 'Details')}"><div class="cu-detail-box"><button type="button" class="cu-button cu-quiet cu-detail-close" data-action="close-detail" data-id="${attr(id)}">Close</button><div class="cu-kicker">${esc(type === 'restaurant' ? 'Local table' : 'Community experience')}</div><h2>${text(title || x.name, 'Details')}</h2><p>${text(description || x.description)}</p>${photos(x.photos || x.images)}<div class="cu-meta">${text(x.location)}</div><div class="cu-actions">${action(target, id, 'View full details', 'cu-gold')}${type === 'restaurant' && x.lat != null && x.lng != null ? action('open-map', id, 'Open map') : ''}</div></div></div>`);
  }

  window.CommunityUI = Object.freeze({ food, provider, admin, journey, post, detail, escapeHTML: esc });
}());