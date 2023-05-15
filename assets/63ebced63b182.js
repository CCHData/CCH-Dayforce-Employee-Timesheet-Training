
"use strict";
//ie8 missing functions
if(typeof String.prototype.trim!=='function'){String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,'');}}
if (!Array.prototype.indexOf){Array.prototype.indexOf = function(elt /*, from*/){var len = this.length >>> 0;var from=Number(arguments[1])||0;from=(from<0)?Math.ceil(from):Math.floor(from);if(from<0)from+=len;for(;from<len;from++){if(from in this&&this[from]===elt)return from;}return -1;};}
// ie9 missing ISO date
if (!Date.prototype.toISOString){(function(){function pad(number){var r=String(number);if(r.length===1){r='0'+r;}return r;} Date.prototype.toISOString=function(){return this.getUTCFullYear()+'-'+pad(this.getUTCMonth()+1)+'-'+pad(this.getUTCDate())+'T'+pad(this.getUTCHours())+':'+pad(this.getUTCMinutes())+':'+pad( this.getUTCSeconds())+'.'+String( (this.getUTCMilliseconds()/1000).toFixed(3)).slice(2,5)+'Z';};}());}
/* Copyright (c) 2023 Elucidat Ltd - All rights reserved */
console.log("Elucidat.com Rapid Authoring (v.#build_version#) built with love on 2023-02-14 06:02:12");
/* 
notes - to add:
    1.2
        cmi.core.student_id
        cmi.core.student_name
    2004
        cmi.learner_id
        cmi.learner_name
*/

/* ELUCIDAT PUBLIC CLASS DEFINITION
* ============================== */
if (!window['Elucidat'])
    var Elucidat;

Elucidat = function (options, lrs_activity_id, lrs_endpoints) {
    var context = this;

    context.options = $.extend({}, {
        allow_completed_pages:1,
        allow_future_pages:true,
        allow_retakes:true,
        global_pass_rate:80,
        global_completion_rate:90,
        completion_action:"completed",
        auto_shuffle_pools:true,
        score_partially_correct:true,
        has_manage_progress_run: false,
        homepage_url: '',
        lms: null,
        loader: null,
        history: {},
        answers: {},
        inputs: {},
        mode: null,
        enable_success_factors_support:false,
        verbs_whitelist: null,
        assets_token: null,
        scorm_mode:"1.2"
    }, options);
    context.course_name = $('title').text();
    context.progress = 0;
    context.pages = {};
    context.question_pools = new QuestionPoolContainer();
    context.page_order = [];
    context.achievements = {};
    context.awarded_achievements = [];
    context.current_page = false;
    context.next_page = null;
    context.previous_page = null;
    context.total_pages = 0;
    context.animation = {
        'in': {
            speed: '0.5s',
            style: 'fadeIn'
        },
        'out': {
            speed: '0.75s',
            style: 'fadeOut'
        }
    };
    context.sent_lms_completion = false;
    context.should_shuffle_pools = false;
    context.sent_lrs_completion = false;
    context.sent_result = false;
    context.has_retaken_questions = false;
    context.sent_termination = false;
    context.$nav_container = null;
    context.navigation_loaded = false;
    context.navigation_created = false;
    context.navigation_template = '';
    context.navigation_attempts = 0;
    context.navigating = 'ready'; // while we are transitioning - don't allow further navigation
    context.uid = 0;
    // session timer
    context.timer = new Elucidat_Timer( this );
    // tincan statement queue
    context.lrs = new Elucidat_Xapi_Queue();
    // set up LRS (backwards compatible for now)
    context.lrs.activity_id = lrs_activity_id || context.options.lrs_activity_id;
    // and pass through any endpoints to send usage data to (backwards compatible for now)
    context.lrs.endpoints = lrs_endpoints || context.options.lrs_endpoints || [];
    // lrs commenting going
    context.commenting_in_progress = false;
    //PHP populates the empty object inside this call to _load_navigation when the course is built.
    
    context.init();
    // now navigation
    this._load_navigation({"template":"<li class=\"menu__item {{page.is_section}} {{page.active}} e-no-controls\">\n    <a href=\"{{page.url}}\" class=\"itemInner menu__item__inner\" title=\"{{page.name}}\" data-dismiss=\"dropdown\">\n        <span class=\"icon\">\n            <i class=\"ti ti-lock\"><span class=\"focusHelper\"><\/span><\/i>\n        <\/span>\n        <span class=\"text e-no-controls\">{{page.name}}<\/span>\n    <\/a>\n    {{page.sub_pages}}\n<\/li>","url_format":"pages\/%s.js","pages":{"61fb09770b226":{"n":"Enter your name","mn":false,"mod":false,"hol":false,"sec":true,"i":true,"s":1,"b":"_61fb09770b267","v":"viewed-all","d":true},"61fb09770e5e5":{"n":"Title page","mn":false,"mod":false,"hol":false,"sec":false,"i":true,"b":"_61fb09770e625","v":"viewed","p":"61fb09770b226"},"61fb097733e2b":{"n":"Grants and how we use them","mn":false,"mod":false,"hol":false,"sec":true,"i":true,"s":1,"b":"_622b74eb9e4b0","v":"viewed-all","d":true},"61fb097736832":{"n":"Approve a Timesheet","mn":false,"mod":false,"hol":false,"sec":false,"i":true,"l":1,"b":"_6222539a840e2","v":"viewed-all","p":"61fb097733e2b"},"61fd68f38be72":{"n":"Salary Employees and your Timesheet","mn":false,"mod":false,"hol":false,"sec":false,"i":true,"l":1,"b":"_62227b5a9b938","v":"viewed-all","p":"61fb097733e2b"},"61fb097748ee2":{"n":"Learner survey","mn":false,"mod":false,"hol":false,"sec":true,"i":true,"s":1,"b":"_6201343cd29ce","v":"viewed"}}});
    // get learner name

};

Elucidat.prototype.init = function () {
    // Protect ajax setups
    $.ajaxSetup({
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            if (XMLHttpRequest.readyState == 0) {
                $('body').trigger('elucidat.navigation.error', errorThrown);
            }
            //return false;
        }
    });
};

Elucidat.navigate = function ( page_code ) {
	// get current Elucidat instance
	var c = e.elucidat;
	// if page_code is a reserved word - check it out
	// first last next previous
	if (page_code === 'first')
		page_code = c.page_order[0];

	else if (page_code === 'last')
		page_code = c.page_order[ c.page_order.length - 1 ];

	else if (page_code === 'next' && c.next_page)
		page_code = c.next_page;

	else if (page_code === 'previous' && c.previous_page)
		page_code = c.previous_page;

	//if there is no previous or next page, don't do anything.
	if(page_code === 'previous' || page_code === 'next') {
		return false;
	}

	// otherwise it should be a page code
	// check
	if (page_code) {
		// now get page object
		var page_request = c.pages[page_code];

		//If the page requested is hidden and part of a question pool we should jump to the first available page from that pool.
		//This can happen if there is a last minute question pool shuffle as the user navs to this page.
		var containingPool = c.question_pools._find_page(page_request.page_id);
		if (page_request.hidden && containingPool) {
			var currentPool = c.question_pools._get_pool(containingPool);

			page_request = c.pages[currentPool.pagesToShow[0]];
		}

		var parentChapterAllowedByRule = page_request.parent ? c.pages[page_request.parent].allowed_by_rule : true;

		var ignoreNavigationRules = getShouldIgnoreNavigationRules();

		// find the project navigation, and make the correct item active
		if (
			(
				page_request &&
				page_request.allowed &&
				page_request.allowed_by_rule &&
				!page_request.hidden &&
				parentChapterAllowedByRule
			) || ignoreNavigationRules
		){
			if (page_request.loaded)
				c._open_page(page_request);
			else
				c._load_href(page_request.url);

			return true;
		}
    }
    return false;
};


Elucidat.navigate_internal = function (scrollTargetY, speed, easing, $target) {
	// scrollTargetY: the target scrollY property of the window
	// speed: time in pixels per second
	// easing: easing equation to use
	var $body = $('body');
	if (
		$body.hasClass('ios-scroll-fix') ||
		window.self !== window.parent && $('html').hasClass('ios') // check if inside iframe and ios
	) {

		$target[0].scrollIntoView();
		
	} else {
		$body.scroll_to(scrollTargetY, speed, easing);

		if ($target) {

			var $focus = $target.closest('[tabindex="0"]');
			if ($focus) {

				setTimeout(function () {
					// needs a timeout in case the link was inside a popup
					$focus.focus();
				}, 1);
			}

		}
	}

};

// wait for bootstrap
(function () {
	function fix_bootstrap () { 

		if ($.fn.popover && $.fn.modal.Constructor) {
			// tooltip titles do wierd horrid behaviour that cocks up accessibility and comments feature
			$.fn.popover.Constructor.prototype.fixTitle = function () {};
		  	// modals need to be moved, so that they come in at the end of the page and overlay everything properly
		  	// this will catch them all as they are set up
			$.fn.moved_modal = $.fn.modal;
			// we need a modal specific event fired, so another sucker punch
			$.fn.modal.Constructor.prototype.old_hideModal = $.fn.modal.Constructor.prototype.hideModal;
			$.fn.modal.Constructor.prototype.hideModal = function () {
				this.old_hideModal.apply(this,arguments);
				this.$element.trigger('modal-hidden');
			};
			// add a custom class on the backdrop
			$.fn.modal.Constructor.prototype.old_backdrop = $.fn.modal.Constructor.prototype.backdrop;
			$.fn.modal.Constructor.prototype.backdrop = function () {
				var re = this.old_backdrop.apply(this,arguments);
				if (this.$element.hasClass('app') && this.$backdrop) {
					this.$backdrop.addClass('app');
				}
				return re;
			};
			// redefine modal popup to move modal prior to launch, and have event handler
		    $.fn.modal = function (options) {
		        return this.each(function() {

		        	var $this = $(this);
		        	// only do for project popups
		        	if ($this.parents("#pew").length && !$this.hasClass('in')) {
		        		// and only if not active
			        	// make a note of where it came from
			        	$this.data('parent', $this.parent());

			        	// make a wrapper for the modal to into
			        	var $modal_holder = $("#pew div:first");
			        	var $modal_wrapper = $modal_holder.find('> div.modal_wrapper');
			        		if (!$modal_wrapper.length) {
			        			$modal_wrapper = $('<div class="modal_wrapper"></div>');
			        			$modal_holder.append($modal_wrapper);
			        		}
			        	// IF the modal came from within a page, we are going to do something horribly dirty. Makes me feel unclean writing it even
			        	// Page edits are locked into the page by the page ID, so we need to wrap the modal in an element with the same ID as the page it came from
			        	// To whoever reads this - sorry - would love to have a better solution - prize if you can give one
			        	var $paw = $this.parents('#paw');
			        	if ($paw.length) {
			        		$modal_wrapper.attr('id', $paw.parent().attr('id'));
			        		// yep - felt dirty writing that
			        	}
			        	// move to just inside project edit wrapper. Should hopefully be inside body tag and so get font size / family
			        	$this.appendTo($modal_wrapper);
			        	// hide from screen readers
			        	// undo modal dialogue behaviour as it is crazy http://webaim.org/discussion/mail_thread?thread=5664
			        	$this.removeAttr('role').removeAttr('aria-labelled-by').attr('tabIndex','-1');

			        	// remove tidy up
				        $this.on('modal-hidden', function (e) {
				        	$(this).modal_destroy();
							return false;
						});
		        	}
			        $this.moved_modal(options);

		            $this.find('div.video_player').video();
		            $this.find('div.audio_player').audio();
                    // update ie8 bg images
                    if (window['ie8bg'])
                        ie8bg.updateElems().getElems().ie8poly_bg_size();
				    
		        });
		    };
		    $.fn.modal.defaults = $.fn.moved_modal.defaults;
			// do not show backdrop on modals for IE7 - as it comes in the wrong position of the page and overlays the modal
			if ($('html').hasClass('ie7'))
				$.fn.modal.defaults.backdrop = false;


			// This code, backported from Bootstrap 3.x removes the scroll bar from the body and prevents it from scrolling while a modal is open.
			var Modal_ScrollFix = function() {
				this.init();
			};
			Modal_ScrollFix.prototype.init = function() {
				this.$body = $('body');
			};
			Modal_ScrollFix.prototype.checkScrollbar = function () {
				var fullWindowWidth = window.innerWidth;
				if (!fullWindowWidth) { // workaround for missing window.innerWidth in IE8
					var documentElementRect = document.documentElement.getBoundingClientRect();
					fullWindowWidth = documentElementRect.right - Math.abs(documentElementRect.left);
				}
				this.bodyIsOverflowing = document.body.clientWidth < fullWindowWidth;
				this.scrollbarWidth = this.measureScrollbar();
			};
			Modal_ScrollFix.prototype.setScrollbar = function () {
				var bodyPad = parseInt((this.$body.css('padding-right') || 0), 10);
				this.originalBodyPad = document.body.style.paddingRight || '';
				if (this.bodyIsOverflowing) {
					this.$body.css({
						'padding-right': bodyPad + this.scrollbarWidth,
						'overflow': 'hidden'
					});
				}
			};
			Modal_ScrollFix.prototype.resetScrollbar = function () {
				this.$body.css({
					'padding-right': this.originalBodyPad,
					'overflow': 'auto'
				});
			};
			Modal_ScrollFix.prototype.measureScrollbar = function () {
				var scrollDiv = document.createElement('div');
				scrollDiv.className = 'modal-scrollbar-measure';
				this.$body.append(scrollDiv);
				var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
				this.$body[0].removeChild(scrollDiv);
				return scrollbarWidth;
			};

			var fixScroll = new Modal_ScrollFix();

			fixScroll.$body
				.on('show', '.modal', function () {
					//on modal open
					fixScroll.checkScrollbar();
					fixScroll.setScrollbar();
					window.top.postMessage('modalopened', '*');
				})
				.on('hidden', '.modal', function (modalEvent) {
					//on modal close
					if(modalEvent.target === modalEvent.currentTarget) {
						// this event is also triggered by closing a tooltip
						// but we dont want to reset the scrollbar on tooltip close
						fixScroll.resetScrollbar();
						window.top.postMessage('modalclosed', '*');
					}
				})
				.on('show.bs.modal', '.modal', function(modalEvent){
					var $this = $(this);

					var $modalContainer = $this.find("div.modal__container");
					var $modalBackdrop = $this.find("a.modal__backdrop");
					if($modalBackdrop.length){
						//if the backdrop is an anchor, change it to a div
						var allHtml = $modalBackdrop[0].outerHTML;
						var newHTML = allHtml.replace('<a', '<div');
						newHTML = newHTML.replace('/a>', '/div>');
						$modalBackdrop.replaceWith(newHTML);
						$modalBackdrop = $this.find("div.modal__backdrop");
					}else {
						$modalBackdrop = $this.find("div.modal__backdrop");
					}
					
					if($modalContainer.length && $modalBackdrop.length){
						//remove the overflow y from the modal
						$this.css('overflow-y', 'initial');
						//put modalContainer in the backdrop and give that the overflow
						$modalContainer.detach();
						$modalBackdrop.append($modalContainer);
						$modalBackdrop.css('overflow-y', 'auto');
					}
                    // we need to add this here - so we remove the data-dismiss
                    // off the modal - as it was closing the modal
                    // when clicking anywhere in the modal itself
                    // this was for 
                    // https://elucidat.mydonedone.com/issuetracker/projects/43949/issues/1217
                    if($modalBackdrop.hasClass( 'modal__dismiss' )) {
                        $modalBackdrop.attr('data-dismiss', '');
                    }
				});

			function pauseAllVideosOnPage (selector) {
				var $selector = $( selector );
				// Find any audio / video players and pause them
				$selector.find('div.video_player').each(function() {
					var $this = $( this );
					// If they happen to be Brightcove, use their api to pause
					if ($this.hasClass('brightcove')) {
						$this.find('video')[0].pause();
					} else {
						$this.video('pause');
					}
				})
			}

			// pause any video / audio on tab reveal
		  	$(document).on('click.interaction.shown', '[data-toggle="tab"]', function (e) {
				var $paw = $('#paw');
				// find any audio / video players and pause them
				pauseAllVideosOnPage($paw);
			    $paw.find('div.audio_player').audio('pause');
		  	});
            
			// pause any video / audio on popup hide
		  	$(document).on('hide.bs.modal', '.modal', function (e) {
				var $this = $( this );
				pauseAllVideosOnPage($this);
                $this.find('div.audio_player').audio('pause');
		  	});

			// mark interacted content as shown
			$(document).on('click.interaction.shown', '[data-toggle="modal"],[data-toggle="dropdown"],[data-toggle="tab"]', function (e) {
				var $this = $(this);
                var $paw = $('#paw');
				var $target = $( $this.attr('data-target') ? $this.attr('data-target') : $this.attr('href') );
				
                if ($target.length) {
                    pauseAllVideosOnPage($paw);
    			    $paw.find('div.audio_player').audio('pause');
					// refresh audio and video players
                    // implement the players
			        $target.find('div.video_player').video();
			        $target.find('div.audio_player').audio();
                    
                    // IF the collapse or modal has completable sections itself - then we wait for 
                    // whatever the sub-item is before we complete
                    // slight delay to let the completable sections to be registered
                    // (as the event is on close there's no great hurry)
                    setTimeout(function () {
                        var $completable = $target.find('.e-scorable-section,.e-completable-section');
                        // if there are completable items...
                        if ($completable.length) {
                            // only add shown on complete
                            // this code adds shown on first complete item
                            $target.on('section_complete', function () {
            			        // add 'tick' on complete
                                $this.addClass('shown');
                            });
                        } else {
                            // just add tick straight away
        			        $this.addClass('shown');
                        }
                    },100);
                    
                    // update ie8 bg images
                    if (window['ie8bg'])
                        ie8bg.updateElems().getElems().ie8poly_bg_size();
		    	
                } else
                    // - no linked modal - just add tick straight away
			        $this.addClass('shown');
		  	});

			// buildups - giving an automatic way of triggering 'next' in a buildup - http://stackoverflow.com/questions/12805825/can-you-specify-a-data-target-for-bootstrap-which-refers-to-a-sibling-dom-elem
			$(document).on('click.collapse-next.data-api', '[data-toggle=collapse-next]', function (e) {
		    	var $this = $(this);
		    	if (!$this.hasClass('shown')) {
		    		// now we check the previous item - we should only allow this click if there isn't a previous, or if previous has been shown
			    	var $previous = $this.prev('[data-toggle=collapse-next]');
			    	if (!$previous.length)
			    		$previous = $this.parent().prev().find('[data-toggle=collapse-next]');
			    	if (!$previous.length || $previous.hasClass('shown')) {
				    	var $target = $this.next('[data-toggle=collapse-next]');
				    	if (!$target.length)
				    		$target = $this.parent().next();
				  		
				  		$this.addClass('shown');
				  		$target.data('collapse') ? $target.collapse('toggle') : $target.collapse();
                        
                        // trigger the shown on the newly shown element after you've had a chance to see it
                        setTimeout(function () {
                            $target.trigger('shown');
                        },2000);
				  		
						// refresh audio and video players
				        $target.find('div.video_player').video();
				        $target.find('div.audio_player').audio();
                        // update ie8 bg images
                        if (window['ie8bg'])
                            ie8bg.updateElems().getElems().ie8poly_bg_size();
			  		}
		  		}
			});
			// accordian - fix behaviour that does not change state of any open accordians when others are clicked
			$.fn.collapse.Constructor.prototype.toggle = function () {

				var $paw = $('#paw');
				var $el = this.$element;
				// find any audio / video players and pause them
			    pauseAllVideosOnPage($paw);
			    $paw.find('div.audio_player').audio('pause');
				setTimeout(function() {
                    // update ie8 bg images
                    if (window['ie8bg'])
					    ie8bg.updateElems().getElems().ie8poly_bg_size();
				},100);

				var shown = $el.hasClass('in');

				if (!shown) {
		    		$el.parents('.accordion:first').find('.accordion-heading > button').removeClass('opened');
					$el.siblings('.accordion-heading').find('> button').addClass('opened');
				} else {
					$el.siblings('.accordion-heading').find('> button').removeClass('opened');
				}

				if($el.hasClass('flipcard')) {
					if(shown) {
						$el.find('.flipcard__front').attr('aria-hidden', false);
						$el.find('.flipcard__front :focusable').attr('aria-hidden', false);
						$el.find('.flipcard__back').attr('aria-hidden', true);
						$el.find('.flipcard__back :focusable').attr('aria-hidden', true);
					} else {
                        $el.find('.flipcard__back').attr('aria-hidden', false);
						$el.find('.flipcard__back :focusable').attr('aria-hidden', false);
                        $el.find('.flipcard__front').attr('aria-hidden', true);
						$el.find('.flipcard__front :focusable').attr('aria-hidden', true);
					}
				}
				this[$el.hasClass('in') ? 'hide' : 'show']();
		    };

			// collapse resizing - removing with a dirty sucker punch
			$.fn.collapse.Constructor.prototype.dimension = function () {
				if (this.$element.hasClass('no-resize')) {
					this.$element.do_nothing = function () { return 'auto'; };
			    	return 'do_nothing';
			    } else {
			    	var hasWidth = this.$element.hasClass('width');
			    	return hasWidth ? 'width' : 'height';
			    }
		    };
			// carousel mods - autoplay false and toggle buttons on slide
			$.fn.carousel.defaults = {
		    	interval: false
			};

			// give jquery the magic of reverse
			$.fn.reverse = [].reverse;

			// disabling last click item in carousels
			$(document).on("slid", function(ev) {

				var $target = $(ev.target);
				var $items = $('.item', $target);
				var is_first = false, is_last = false;

				// find any audio / video players and pause them
				pauseAllVideosOnPage($items);
		        $items.find('div.audio_player').audio('pause').audio();
                // update ie8 bg images
                if (window['ie8bg'])
                    ie8bg.updateElems().getElems().ie8poly_bg_size();

				// iterate to find first and last
				$items.each(function (index) {
					if ( !$(this).closest('.add-option-template').length ) {
						if ( $(this).hasClass('active'))
							is_first = true;
						return false;
					}
				});

				// now same in reverse
				$items.reverse().each(function (index) {
					if ( !$(this).closest('.add-option-template').length ) {
						if ( $(this).hasClass('active'))
							is_last = true;
						return false;
					}
				});

				$('[data-slide]', $target) // find prev/next buttons inside the target carousel element.
					.add('[data-slide][href="#' + $target.attr('id') + '"]') //add any buttons with matching ID from outside of the carousel.
					.each(function () {
						var $el = $(this);
						if ($el.attr('data-slide') === 'prev') {
							if (is_first) {
                                $el.addClass('hide');
                            } else {
								$el.removeClass('hide');
							}
						} else if ($el.attr('data-slide') === 'next') {
							if (is_last) {
								$el.addClass('hide');
							} else {
								$el.removeClass('hide');
							}
						}
				});
			});
		// otherwise wait until ready
		} else {
			setTimeout(fix_bootstrap,125);
		}
	}
	fix_bootstrap();
})();

/* Elucidat_Milestone PUBLIC CLASS DEFINITION
* ============================== */
var Elucidat_Milestone = function ( pass_rate ) {
    this.pass_rate = parseInt( pass_rate );//ep.options.global_pass_rate );
    this.score = 0;   
    this.score_possible = 0;
    this.progress = 0;
    this.progress_possible = 100;
    this.completion_rate = 100; 
};
Elucidat_Milestone.prototype.addScore = function (score, out_of, weighting) {
    this.score += parseFloat(score) * parseInt(weighting);
    this.score_possible += out_of * parseInt(weighting);
};
Elucidat_Milestone.prototype.getScore = function () {
    if (this.score == 0) return 0;
    return Math.round(100/this.score_possible*this.score);
};
Elucidat_Milestone.prototype.getScoreResult = function () {
    // assume a pass if there is no scoring at all
    return (!this.score_possible || this.getScore() >= this.pass_rate ? true : false );
};
Elucidat_Milestone.prototype.getProgress = function () {
    if (this.progress == 0) return 0;
    return Math.round(100/this.progress_possible*this.progress);
};
Elucidat_Milestone.prototype.getAnswerGiven = function (answerToFind, pages) {
    //Returns true if the answer id has been submitted by the user.
    var answerFound = false;
    $.each(pages, function(i, page) {

        if(answerFound) return false;

        if(page.answer && typeof page.answer === 'object' && page.answer.length) {
            // A page can have multiple questions, loop through questions here.
            for(var j=0; j<page.answer.length; j++) {
                if(answerFound) break;
                var answer = page.answer[j];

                for(var k=0; k<answer.answer.length; k++) {
                    var answerID = answer.answer[k];

                    //After bookmarking the answer ID has the answer's text appended to it after a [:], remove it.
                    if(typeof answerID === 'string' && answerID.indexOf('[:]') !== -1) {
                        answerID = answerID.split('[:]')[0]
                    }
                    if('pa_' + page.page_id + '_' + answerID === answerToFind) {
                        answerFound = true;
                    }
                }
            }
        }
    });
    return answerFound;
};
Elucidat_Milestone.prototype.getProgressResult = function () {
    return this.getProgress() >= this.completion_rate;
};

// these are the page processing 
Elucidat_Milestone.prototype.evaluateStatement = function ( statement, pages ) {

    // if it has with brackets, then it contains groups of statements, and needs to be split
    if ( statement.indexOf('(') !== -1 &&  statement.indexOf(')') !== -1) {
        return this.splitStatement( statement, pages );

    } else {
        // now work out if the statement is true
        // each statement has <variable> <operator> <value>
        // 
        var variable = null;
        var split = statement.split(' ');

        if (split.length == 3) {

            // there is a special case - pages_seen
            if (split[0] == 'page_seen') {
                //console.log(pages[ split[2] ]);
                if (!pages[ split[2] ])
                    return false;
                else {
                    //console.log('result',pages[ split[2] ].completed);
                    return pages[ split[2] ].completed ? true : false;
                }
            } else if (split[0] == 'page_passed') {
                if (!pages[ split[2] ])
                    return false;
                else
                    return pages[ split[2] ].score === 1 ? true : false;

            } else if (split[0] == 'page_failed') {
                if (!pages[ split[2] ])
                    return false;
                else
                    // no submitted score is a false - 
                    return pages[ split[2] ].score === null || pages[ split[2] ].score === 1 ? false : true;
            } else if (split[0] === 'page_answer') {
                //Check all the answers given so far and see if they include the id at split[2].
                return this.getAnswerGiven(split[2], pages);

            }
            // otherwise if it is numeric, make it into a number
            if (!isNaN(split[2]))
                split[2] = parseInt(split[2]);

            //  otherwise clean up boolean values
            if (split[2] == 'pass' || split[2] == 'yes' || split[2] == 'true')
                split[2] = true;

            else if (split[2] == 'fail' || split[2] == 'no' || split[2] == 'false')
                split[2] = false;

            // now do the heavy lifting
                // this needs customising of course
            if (split[0] == 'score')
                variable = this.getScore();

            else if (split[0] == 'completion')
                variable = this.getProgressResult();

            else if (split[0] == 'result')
                variable = this.getScoreResult();

            else if (split[0] == 'percentage_complete')
                variable = this.getProgress();

            else
                return false;

            // now process
            if (split[1] == '>') {
                if (variable > split[2])
                    return true;

            } else if (split[1] == '>=') {
                if (variable >= split[2])
                    return true;

            } else if (split[1] == '<') {
                if (variable < split[2])
                    return true;

            } else if (split[1] == '<=') {
                if (variable <= split[2])
                    return true;

            } else if (split[1] == '==') {
                if (variable == split[2])
                    return true;

            } else if (split[1] == '!=') {
                if (variable != split[2])
                    return true;

            }

        }
        return false;

    }
};

Elucidat_Milestone.prototype.splitStatement = function ( conditions, pages ) {

    //regex to get array of all the <variable> <operator> <value> parts. E.g. page_seen = 57839b28c27c6
    //https://regex101.com/r/qD4uV4/4
    var groups = conditions.match(/\w+\s[^\|\&\(\)]{1,2}\s[\w\-]+/g);

    for(var i=0; i<groups.length; i++) {
        //evaluate each part and replace it in the original string with just true or false.
        var answer = this.evaluateStatement( groups[i], pages ).toString();
        conditions = conditions.replace(groups[i], answer);
    }

    // Eval the whole thing.
    return eval (conditions);

};var QuestionPoolContainer = function() {

    this.pools = {};
};

//Adds a page from the original json_object with a q property and puts it into the correct pool. Creates pools as required.
QuestionPoolContainer.prototype._add_page = function(page) {
    if(!page.q) return;
    var poolName = page.q;

    if (!this.pools[ poolName ]) {
        this._create_pool(poolName);
    }

    this.pools[ poolName ].pages.push( page.id );

};

//Creates a new pool with a given name in format name:percent e.g. myPool:20
QuestionPoolContainer.prototype._create_pool = function(poolName) {
    var q_name_split = poolName.split(':'); // first get the name and percentage of the question pool
    var percentageToHide = 1 - (1 / 100 * parseInt(q_name_split[1])); // calculate the number of pages from the question pool that should be hidden

    this.pools[ poolName ] = {
        pages: [],
        percentageToHide:percentageToHide,
        numToHide: -1,
        name: q_name_split[0],
        pagesToShow : [],
        pagesToHide : []
    };
};

QuestionPoolContainer.prototype._get_pool = function(poolName) {
    //returns a specific pool or all pools if poolName not passed.
    if(poolName && this.pools[poolName]) {
        return this.pools[poolName];
    } else if(poolName) {
        throw 'Pool ' + poolName + ' not found.';
    }
    return this.pools;
};

//Returns list of pages hidden by all question pools.
QuestionPoolContainer.prototype._get_all_pages_to_hide = function() {
    var pagesToHide = [];

    $.each(this.pools, function(i, pool) {
        pagesToHide = pagesToHide.concat(pool.pagesToHide);
    });

    return pagesToHide;
};

//Returns list of pages shown by all question pools.
QuestionPoolContainer.prototype._get_all_pages_to_show = function() {
    var pagesToShow = [];

    $.each(this.pools, function(i, pool) {
        pagesToShow = pagesToShow.concat(pool.pagesToShow);
    });

    return pagesToShow;
};

//Returns list of all pages in quesiton pools.
QuestionPoolContainer.prototype._get_all_pages_in_pools = function() {
    var pages = [];

    $.each(this.pools, function(i, pool) {
        pages = pages.concat(pool.pages);
    });

    return pages;
};

//Takes a page ID and returns the pool it belongs to. Returns false if not found.
QuestionPoolContainer.prototype._find_page = function(pageID) {
    var found = false;
    $.each(this.pools, function(poolName,pool) {
        for(var i=0; i<pool.pages.length; i++) {
            if(pool.pages[i] === pageID) {
                found = poolName;
                break;
            }
        }
        if(found){
            return false; //return false = break from jQuery each.
        }

    });
    return found;
};

// Reshuffle the question pools and select differnet questions. Works in conjunction with Elucidat._shuffle_question_pools
// It will re-populate the pagesToShow and pagesToHide objects.
QuestionPoolContainer.prototype._shuffle = function() {

    $.each(this.pools, function(i, pool) {
        // only drop questions if needed
        if (pool.percentageToHide < 1) {
            // how many should we pick?
            pool.numToHide = pool.pages.length * pool.percentageToHide;

            // randomise the array
            pool.pagesToShow = pool.pages.shuffle();

            //repopulate pagesToHide
            pool.pagesToHide = [];

            for (var i = 0; i < pool.numToHide; i++) {
                pool.pagesToHide.push(pool.pagesToShow.shift())
            }
        }
    });


};
/* Elucidat_Timer PUBLIC CLASS DEFINITION
* ============================== */
var Elucidat_Timer = function ( ep ) {

    this.elucidat = ep;
    // current page and chapter
    this.current_page = false;
    this.current_chapter = false;
    // timestamp for start times
    this.session_start = Date.now();
    this.session_time = 0;
    this.chapter = {};
    this.page = {};
    
    // redirect rules
    this.timers = [];

    var t = this;

    var shouldDisableTimer = getShouldDisableTimer();
    
    // Check whether we should set the
    // timer before setting it
    if(!shouldDisableTimer) {
        setInterval(function () {
            t.clock();
        }, 1000);
    }
};

Elucidat_Timer.prototype.redirect = function ( page_id ) {
    if (this.elucidat) {
        var page_request = this.elucidat.pages[ page_id ];
        if (page_request.allowed && page_request.allowed_by_rule) {   
            if (page_request.loaded)
                this.elucidat._open_page ( page_request );
            else
                this.elucidat._load_href ( page_request.url );
        }
    }
};

Elucidat_Timer.prototype.clock = function () {

    if (this.current_page) {
        var c = this;
        var now = Date.now();

        // time elapsed
        c.session_time = now - c.session_start;
        //c.chapter_time = now - c.session_start;
        if (c.page[ c.current_page ]) {
            c.page[ c.current_page ].time = now - c.page[ c.current_page ].start;
            // page time left
            if (c.page[ c.current_page ].limit) {
                c.page[ c.current_page ].remaining = c.page[ c.current_page ].limit - c.page[ c.current_page ].time;
                
                // redirect rules - here
                if (c.page[ c.current_page ].remaining <= 0) {
                    // set to 0
                    c.page[ c.current_page ].remaining = 0;
                    // if there is a redirect - do it
                    if (c.page[ c.current_page ].redirect && !c.page[ c.current_page ].redirected) {
                        c.page[ c.current_page ].redirected = true;
                        c.redirect( c.page[ c.current_page ].redirect );
                        return;
                    }
                }
            } else {
                c.page[ c.current_page ].remaining = null;
            }
        }
        if (c.chapter[ c.current_chapter ]) {
            c.chapter[ c.current_chapter ].time = now - c.chapter[ c.current_chapter ].start;
            // chapter time left
            if (c.chapter[ c.current_chapter ].limit) {
                c.chapter[ c.current_chapter ].remaining = c.chapter[ c.current_chapter ].limit - c.chapter[ c.current_chapter ].time;

                // redirect rules - here
                if (c.chapter[ c.current_chapter ].remaining <= 0) {
                    // set to 0
                    c.chapter[ c.current_chapter ].remaining = 0;
                    // if there is a redirect - do it
                    if (c.chapter[ c.current_chapter ].redirect && !c.chapter[ c.current_chapter ].redirected) {
                        c.chapter[ c.current_chapter ].redirected = true;
                        c.redirect( c.chapter[ c.current_chapter ].redirect );
                        return;
                    }
                }
            } else {
                c.chapter[ c.current_chapter ].remaining = null;
            }
        }
        // now update display of timers
        c._update( this.timers );

    }
};

Elucidat_Timer.prototype.page_start = function ( page_id, limit, redirect ) {

    if (page_id != this.current_page) {
        // are are starting a new page

        // if this page isn't running already - add it into register
        if (this.page[ page_id ] == undefined ) {
            // init
            this.page[page_id] = {};
            // set start time
            this.page[page_id].start = Date.now();
            this.page[page_id].time = 0;
            // set limit and redirect
            if (limit) {
                this.page[page_id].limit = limit * 1000; // convert to milliseconds
                this.page[page_id].remaining = limit * 1000; // convert to milliseconds
                // now redirect
                if (redirect)
                    this.page[page_id].redirect = redirect;
            }
        } else {
            // if page has been visited already, there will be some time already
            // so we reset the start time to now - time already - so that clock is always right
            this.page[page_id].start = Date.now() - this.page[page_id].time;
        }
        // now set current page
        this.current_page = page_id;
    }    
};

Elucidat_Timer.prototype.chapter_start = function ( page_id, limit, redirect ) {
    
    if (page_id != this.current_chapter) {
        // are are starting a new page

        // if this page isn't running already - add it into register
        if (this.chapter[ page_id ] == undefined ) {
            // init
            this.chapter[page_id] = {};
            // set start time
            this.chapter[page_id].start = Date.now();
            this.chapter[page_id].time = 0;
            // set limit and redirect
            if (limit) {
                this.chapter[page_id].limit = limit * 1000; // convert to milliseconds
                this.chapter[page_id].remaining = limit * 1000; // convert to milliseconds
                // now redirect
                if (redirect)
                    this.chapter[page_id].redirect = redirect;
            }
        } else {
            // if page has been visited already, there will be some time already
            // so we reset the start time to now - time already - so that clock is always right
            this.chapter[page_id].start = Date.now() - this.chapter[page_id].time;
        }
        // now set current page
        this.current_chapter = page_id;
    }    
};


Elucidat_Timer.prototype.register = function ( $timers ) {
    // first clean up the timers we have
    var new_timers = [];
    var static_timers = [];
    // go through and check they are still there
    for (var i=0; i<this.timers.length;i++) {
        if (this.timers[i].length) {
            // if timer is still there,
            // add back to new_timers array
            new_timers.push( this.timers[i] );
        }
    }
    // now do the same for the new timers coming in (and mark them as done if they are)
    $timers.each(function () {
        var $timer = $(this);
        if (!$timer.hasClass('e-timer')) {
            if ($timer.hasClass('static')) {
                // static timers are not added to our array - they are updated once, and left
                static_timers.push( $timer );
            } else { 
                // add to updating array
                new_timers.push( $timer );
            }
            // and mark as setup
            $timer.addClass('e-timer');
        }
    });
    // update static timers - once
    this._update( static_timers );

    // now write back to object
    this.timers = new_timers;
};

Elucidat_Timer.prototype._format_time = function ( milliseconds ) {

    if (!milliseconds)
        return '';

    var time = new Date(milliseconds);

    var h = time.getUTCHours();
    var m = time.getMinutes();
    var s = time.getSeconds();
    
    return (h ? h + ':' : '') + (m < 10 && h ? '0' : '') + (m ? m + ':' : '') + (s < 10 && m ? '0' : '') + s;
};

Elucidat_Timer.prototype._update = function ( timers_array ) {
    /*
    console.log('---------------------');
    console.log('session_time: '+this._format_time( this.session_time ));
    console.log('page_time: '+this._format_time( this.page[ this.current_page ].time ));
    console.log('chapter_time: '+this._format_time( this.chapter[ this.current_chapter ].time ));

    console.log('page_time_remaining: '+this._format_time( this.page[ this.current_page ].remaining ));
    console.log('chapter_time_remaining: '+this._format_time( this.chapter[ this.current_chapter ].remaining ));
    */
    for (var i=0; i<timers_array.length;i++) {
        if (timers_array[i].length) {
            var $timer = timers_array[i];

            if ($timer.hasClass('session_time'))
                $timer.text( this._format_time( this.session_time ) );

            else if ($timer.hasClass('chapter_time') && this.chapter[ this.current_chapter ])
                $timer.text( this._format_time( this.chapter[ this.current_chapter ].time ) );

            else if ($timer.hasClass('page_time') && this.page[ this.current_page ])
                $timer.text( this._format_time( this.page[ this.current_page ].time ) );

            else if ($timer.hasClass('chapter_time_remaining') && this.chapter[ this.current_chapter ])
                $timer.text( this._format_time( this.chapter[ this.current_chapter ].remaining ) );

            else if ($timer.hasClass('page_time_remaining') && this.page[ this.current_page ])
                $timer.text( this._format_time( this.page[ this.current_page ].remaining ) );
            
        }
    }
};var done_first_error = false;
var Elucidat_Xapi_Queue = function () {
    //
    this.activity_id = '';
    this.learner_name = null;
    this.endpoints = [];
    this.statement_queue = [];
    this.processing = false;
};

// In offline mode, the registration id (probably) comes after the page load
Elucidat_Xapi_Queue.prototype.set_registration = function ( reg_id ) {
    // then do lms attempted call
    for (var i = 0; i < this.endpoints.length; i ++ ) {
        this.endpoints[i].registration = reg_id;
    }
};

Elucidat_Xapi_Queue.prototype.queue = function (statement_options, callback ) {
    var c = this;
    var releaseMode = window.endpoint && window.endpoint.mode;

    if (statement_options.verb === 'terminated' && (releaseMode && releaseMode === 'online')) {
        setTimeout(function () {
            if ('_delete_bookmark' in e.elucidat.options.loader) {
                e.elucidat.options.loader._delete_bookmark();
            }
        },15);
    }

    // Check if we have a verb whitelist, and if this verb is in it
    if(Array.isArray(e.elucidat.options.verbs_whitelist)){
        if(e.elucidat.options.verbs_whitelist.indexOf(statement_options.verb) < 0){
            return false;// Dont put it on the queue if its not on the whitelist
        }
    }

    // insert timestamp onto statement
    var timestamp = new Date();
    statement_options.timestamp = timestamp.toISOString();

    // convert duration to the right format - if exists - will arrive in milliseconds
    if (statement_options.duration !== null && statement_options.duration !== undefined)
        statement_options.duration = 'PT'+(Math.round(parseInt(statement_options.duration)/1000))+'S';


    // tmp
    // console.log( statement_options );

    // queue a statement for each endpoint
    for (var i = 0; i < c.endpoints.length; i ++) {
        c.statement_queue.push({
            'endpoint': i,
            'statement_options': statement_options,
        // only callback once per queue
            'callback': (i == 0 ? callback : null)
        });
    }
    e.elucidat.lrs.lastAddedTime = new Date().getTime();
    // attempt a send
    if(statement_options.verb === 'terminated' || e.elucidat.current_page === e.elucidat.page_order[e.elucidat.page_order.length - 1]){
        setTimeout(function () {
            c.send();
        },15);
    }
};

$('body').on('elucidat.page.ready', function(event, page_data, $new_page) {
    setTimeout(function () {
        e.elucidat.lrs.send();
    },15);
});

$('body').on('elucidat.navigation.loaded', function (event, navigation_data, $navigation_object) {
    //On navigation loaded we'll kick off a cleanup script to catch any api calls over 2mins old
    e.elucidat.lrs.lastAddedTime = new Date().getTime();
    setInterval(function(){
        if(e.elucidat.lrs.lastAddedTime < (new Date().getTime() - 120000) && e.elucidat.lrs.statement_queue.length > 0){
            e.elucidat.lrs.send();
        }
    }, 60000);
});

//when the window is about to close, if there's anything left in the queue, lets try and send it.
$( window ).unload(function() {
  if(e.elucidat.lrs.statement_queue.length > 0){
      e.elucidat.lrs.send(false);
  }
});

Elucidat_Xapi_Queue.prototype.send = function (doAsync) {
    var async = true;
    if(doAsync === false){
        async = doAsync;
    }

    if(this.statement_queue.length > 0 ){

        var new_queue = [];
        var registration;
        // make sure we only run once at a time
        if (this.processing)
            return;
        this.processing = true;

        for(var i = 0; i <this.endpoints.length; i++){
            var call = {};
            call.statements = [];
            call.callbacks = [];

            registration = this.endpoints[i].registration; // see if the endpoint has a registration id
            call.endpoint = this.endpoints[i].endpoint;
            call.authentication = this.endpoints[i].authentication;

            for(var n = 0; n < this.statement_queue.length; n++){
                if(this.statement_queue[n].endpoint === i){
                    if(!registration){
                        new_queue.push(this.statement_queue[n]); // requeue this item if no registration id (meaning the lrs is not active)
                    }else{
                        call.statements.push(this._make_xapi_statement(registration, this.statement_queue[n].statement_options));
                        call.callbacks.push(this.statement_queue[n].callback);
                    }
                }
            }
            if (call.statements.length || !window.done_first_error) {

                var xAPICallbackHandler = function (data) {
                    for (var x = 0; x < call.callbacks.length; x++) {
                        if (typeof call.callbacks[x] === 'function') {
                            call.callbacks[x](data);
                        }
                        // Run 'call.callbacks' as each statement can have its own callback so if it's been batched 
                        // loop through them all and run each one in turn.
                    }
                };

                if (this.endpoints[i].xapi && this.endpoints[i].endpoint) {
                    this._do_xapi_call(call.statements, this.endpoints[i], xAPICallbackHandler);
                } else if (call.endpoint) {
                    this._do_ajax_call(async, call.endpoint, call.authentication, call.statements, xAPICallbackHandler);
                }

                if (!call.statements.length){
                    window.done_first_error = true;
                }
            }

        }

        // reset the queue
        this.statement_queue = new_queue;
        // mark processing as finished
        this.processing = false;
    }
};

Elucidat_Xapi_Queue.prototype._do_ajax_call = function (async, endpoint, authentication, statement, callback) {
    var ajax_options = {
        url: endpoint,
        type: 'POST',
        crossDomain: true,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: {},
        async: async,
        complete: function(data, textStatus, xhr) {
            if (callback)
                callback(data);
        },
        error: function(xhr) {
            //console.log("Error calling TinCanAPI, status code " + xhr.status + ", message: " + xhr.responseText);
        }
    };

    if (!xhr2) {
        ajax_options.dataType = "jsonp";
        ajax_options.data.credentials = authentication;
        ajax_options.data.statement = statement;
    } else {
        ajax_options.beforeSend = function (xhr) {
            xhr.setRequestHeader ("Authorization", "Basic "+authentication);
            xhr.setRequestHeader ("X-Experience-API-Version", "1.0.0");
        };
        ajax_options.data = JSON.stringify( statement );
    }

    $.ajax(ajax_options);

};

Elucidat_Xapi_Queue.prototype._do_xapi_call = function (statements, endpointData, callback) {
    var xApiStatements = statements;

    /**
     * Grabs the learner name and email, first by attempting to find it in the lms scorm interface of the
     * course loader, and if that fails then from the "endpoint" object which is defined in main the course HTML.
     * @param {Elucidat_CourseLoader} courseLoader
     * @param {object} endpoint And object which may or may not contain leaner_user info.
     * @return {object} An object containing learnerName and learnerEmail keys
     */
    var getLearnerInfo = function (courseLoader, endpoint) {
        var learnerInfo = {
            learnerName: '',
            learnerEmail: ''
        };

        if ((courseLoader.lms.scorm_interface) && (typeof courseLoader.lms.scorm_interface === 'object')) {
            if (courseLoader.lms.scorm_interface.LearnerName) {
                learnerInfo.learnerName = courseLoader.lms.scorm_interface.LearnerName;
            } else if (courseLoader.lms.GetLearnerName()) {
                learnerInfo.learnerName = courseLoader.lms.GetLearnerName();
            }

            if (courseLoader.lms.scorm_interface.LearnerId) {
                learnerInfo.learnerEmail = courseLoader.lms.scorm_interface.LearnerId;
            } else if (courseLoader.lms.GetLearnerID()) {
                learnerInfo.learnerEmail = courseLoader.lms.GetLearnerID();
            }
        }

        if (learnerInfo.learnerName && learnerInfo.learnerEmail) {
            return learnerInfo;
        }

        if (!endpoint.hasOwnProperty("learner_user")) {
            return learnerInfo;
        }

        if (!learnerInfo.learnerName) {
            if (endpoint.learner_user.hasOwnProperty("name")) {
                learnerInfo.learnerName = endpoint.learner_user.name;
            }
        }

        if (!learnerInfo.learnerEmail) {
            if (endpoint.learner_user.hasOwnProperty("email")) {
                learnerInfo.learnerEmail = endpoint.learner_user.email;
            }
        }

        return learnerInfo;
    }

    // "e" is defined in 05_Elucidat_Initialiser - var e = new Elucidat_CourseLoader();
    var learnerInfo = getLearnerInfo(e, window.endpoint);

    // LearnerEmail must exist and is required for the xAPI 'mbox' field.
    if (!learnerInfo.learnerEmail) {
        return;
    }

    // Restore actor values to statements.
    for (var j = 0; j < xApiStatements.length; j++) {
        xApiStatements[j].actor = {
            "mbox": "mailto:" + learnerInfo.learnerEmail,
            "name": learnerInfo.learnerName
        }
    }

    var xApiXhr = new XMLHttpRequest();
    xApiXhr.open('POST', endpointData.endpoint);
    xApiXhr.setRequestHeader("Accept", "*/*");
    xApiXhr.setRequestHeader("Authorization", "Basic " + endpointData.authentication);
    xApiXhr.setRequestHeader("X-Experience-API-Version", '1.0.0');
    xApiXhr.setRequestHeader("Content-Type", 'application/json');

    xApiXhr.onreadystatechange = function (data) {
        if (xApiXhr.readyState === 4) {
            if (xApiXhr.status === 200) {
                if (callback) {
                    callback(data);
                }
            } else {
                console.warn('xApiXhr response error' + xApiXhr.status + ': ' + xApiXhr.responseText);
            }
        }
    };

    xApiXhr.send(JSON.stringify(xApiStatements));
}

Elucidat_Xapi_Queue.prototype._make_xapi_statement = function ( registration, options ) {

    var statement = {
        'actor': {},
        'context': {
            'contextActivities': {
                "parent": [{
                    "id": options.url
                }],
                "category": [{
                    "id":"https://elucidat.com",
                    "definition": {
                        "name":{
                            "en-US":"Elucidat.com"
                        },
                        "description": {
                            "en-US": "Course lovingly crafted with the Elucidat.com rapid authoring tool"
                        }
                    }
                }]
            },
            "extensions": {
                "https://app.elucidat.com/xapi/tags": "",
                "https://app.elucidat.com/xapi/title": ""
            }
        },
        "object":{
            "objectType": "Activity",
            "definition": {
                "type": null
            }
        },
        "verb": {
            "id": "http://adlnet.gov/expapi/verbs/"+options.verb,
            "display": {
                "en-US": options.verb
            }
        },
        "result": {
            // Progress is added as an extension that uses an arbitrary URI
            // An extension is used as there doesn't appear to be a convention on how progress is recorded, 'The Score Object SHOULD NOT be used for scores relating to progress or completion. Consider using an extension (preferably from an established Community of Practice) instead.' https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#miscext
            // I wasn't able to find a Community of Practice for this other than the CMI 5 one, so have assigned this the arbritrary value (which is how many of the examples are formatted in xAPI docs).
            "extensions": {
                "https://app.elucidat.com/xapi/progress": 0
            }
        },
        "timestamp": options.timestamp
    }
    // registration id
    statement.context.registration = registration;

    // activity id
    // if page url add onto main url
    if (options.page_url) {
        // url might contain a ?
        // split the URL into parts
        var spl_url = unescape(options.url).split('?');
        var spl_page_url = options.page_url.split('/');
        if (options.uuid && (typeof learner_service_2021_in_use !== 'undefined') && learner_service_2021_in_use) {
            statement.object.id = spl_url[0] + '/' + spl_page_url[0] + '/' + options.uuid;
        } else {
            statement.object.id = spl_url[0] + '/' + options.page_url + (spl_url[1] ? escape('?' + spl_url[1]) : '');
        }
    } else {
        // otherwise just the URL
        statement.object.id = options.url;
    }

    if (options.tags) {
        statement.context.extensions['https://app.elucidat.com/xapi/tags'] = options.tags;
    }

    if (options.title) {
        statement.context.extensions['https://app.elucidat.com/xapi/title'] = options.title;
    }

    // if one of the start/end calls
    if (options.verb == "attempted" || options.verb == "commented" || options.verb == "completed" || options.verb == "passed" || options.verb == "failed" || options.verb == "terminated") {
        if (options.verb == "commented")
            statement.object.definition.type = "http://adlnet.gov/expapi/activities/commented";
        else
            statement.object.definition.type = "http://adlnet.gov/expapi/activities/course";
        // course name
        statement.object.definition.name = { "en-US": options.course_name };

    // otherwise it is scored
    } else {

        if (options.verb == "answered") {
            // cmi interaction type
            statement.object.definition.type = "http://adlnet.gov/expapi/adlnetctivities/cmi.interaction";

            // question definition
            if (options.choices)
                statement.object.definition.choices = options.choices;

            if (options.scale)
                statement.object.definition.scale = options.scale;

            if (options.interaction_type)
                statement.object.definition.interactionType = options.interaction_type;
            else
                statement.object.definition.interactionType = "other";

            if (options.correct_responses_pattern)
                statement.object.definition.correctResponsesPattern = options.correct_responses_pattern;

            if (options.source)
                statement.object.definition.source = options.source;

            if (options.target)
                statement.object.definition.target = options.target;

        // otherwise it is a page
        } else
            statement.object.definition.type = "http://activitystrea.ms/schema/1.0/page";

        // activity name (page name)
        statement.object.definition.name = { "en-US": options.page_name };

    }
    // add description if apt
    if (options.description)
        statement.object.definition.description = { "en-US": options.description };

    // add result if apt
    if (options.score !== null && options.score !== undefined)
        statement.result.score = { "scaled": options.score / 100 };

    // completed
    if (options.completed)
        statement.result.completion = true;
    else
        statement.result.completion = false;

    // passed
    if (options.passed === true)
        statement.result.success = true;

    // failed
    else if (options.passed === false)
        statement.result.success = false;

    // duration
    if (options.duration)
        statement.result.duration = options.duration;

    // answer
    if (options.answer) {
        statement.result.response = options.answer;
    }


    if (options.revision)
        statement.context.revision = options.revision;

    // If you have moved to a new page (experienced) or completed the course, the XAPI statement will include progression.
    // Note that we could've added a condition to stop updating progress once the activity is completed to match this: https://github.com/elucidat/elucidat-authoring-tool-build/blob/master/javascript/release/build/elucidat/_page_complete.js#L12
    // However this was deemed unnecessary for this piece of work as the specific use case is unlikely to include rules or questions pools.
    if (options.progression !== undefined) {
        statement.result.extensions = { "https://app.elucidat.com/xapi/progress": options.progression };
    }

    // remove empty result
    if (jQuery.isEmptyObject(statement.result)) {
        delete statement.result;
    }

    return statement;
};

// load a url
Elucidat.prototype._award_achievement_badges = function ( achievement ) {
    if (achievement)
        $('img.achievement_badge.'+achievement).addClass('awarded');
    else
        for (var i = 0; i < this.awarded_achievements.length; i++ )
            $('img.achievement_badge.'+this.awarded_achievements[i]).addClass('awarded');
}
Elucidat.prototype._achievement = function ( achievement ) {
    var $body = $('body');
    $body.addClass( 'achievement-'+achievement );
    $body.trigger('elucidat.achievement', [ achievement ]);
    // add awarded class to any achievement badges
    if ( this.awarded_achievements.indexOf(achievement) == -1)
        this.awarded_achievements.push( achievement );
    // now do the badge
    this._award_achievement_badges( achievement );
}// animate in
Elucidat.prototype._animate_in = function ( $new_page, callback ) {

    // first look for any items with the animation classes
    var context = this;
    $new_page.find('[data-animation]').each(function () {
        var $item = $(this);
        var attr = $item.attr('data-animation').split('|');
            //console.log(attr);
        var in_style = ( attr[0] && attr[0] != '-' ? attr[0] : null );
        if (in_style) {
            var duration = ( attr[1] ? attr[1] : 1 )+'s';
            var wait_until_on_screen = false;
            if (new String( attr[2] ).substr(0,1) == '(') {
                attr[2] = parseFloat(attr[2].replace('(','').replace(')',''));
                wait_until_on_screen = true;
            }
            var delay = (( attr[2] ? parseFloat(attr[2]) : 0 )*1000) + (parseFloat(context['animation']['in']['speed'])*1000);// + 1000
            // do we fade out after a while?
            var out_delay = (( attr[5] ? parseFloat(attr[5]) : 0 )*1000);
            var out_style = ( attr[3] && attr[3] != '-' ? attr[3] : null );
            var out_duration = parseFloat( attr[4] && attr[4] != '-' ? attr[4] : 0 ) * 1000;

            // add hide class
            $item.addClass('e-hide');

            var do_animation = function () {
                setTimeout(function () {
                    // don't do if already animating out
                    if (!$item.hasClass('e-animated-out')) {
                        $item.css({
                            '-webkit-animation-duration':   duration,
                            '-moz-animation-duration':      duration,
                            'animation-duration':           duration
                        });
                        $item.addClass( 'e-animated' ).addClass( in_style );
                        $item.removeClass('e-hide');

                        // if out_delay - do out animation
                        if (out_delay && out_style && out_duration) {
                            setTimeout(function () {
                                if (!$item.hasClass('e-animated-out')) {
                                    // element
                                    $item.addClass( 'e-animated-out' );
                                    $item.removeClass( in_style );
                                    $item.css({
                                        '-webkit-animation-duration':   out_duration,
                                        '-moz-animation-duration':      out_duration,
                                        'animation-duration':           out_duration
                                    });
                                    $item.addClass( out_style );
                                    $item.removeClass('e-hide');

                                    setTimeout(function () {
                                        $item.hide();
                                    }, out_duration);
                                }
                            }, out_delay);
                        }

                    }
                }, delay);
            };
            if (wait_until_on_screen)
                $item.wait_until_on_screen({
                    callback: do_animation
                });
            else
                do_animation();
        }
        // add fixer for safari (hardware acceleration)
        // this is a horrible hack - @todo - let's drop this asap
        if ( /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor) ) {
            if ( $item.parent().find('.modal').length == 0) {
                $item.parent().addClass('e-anim-acceleration');
            }
        }
    });
    // add page in speed
    $new_page.addClass( 'e-animated' );
    $new_page.addClass( context['animation']['in']['style'] );
    $new_page.css({
        '-webkit-animation-duration':   context['animation']['in']['speed'],
        '-moz-animation-duration':      context['animation']['in']['speed'],
        'animation-duration':           context['animation']['in']['speed']
    });
    // add animation style
    $new_page.show();

    if (callback)
        setTimeout(callback, parseFloat(context['animation']['in']['speed'])*1000);

    // make sure we are at scroll position 0,0 for the new page
    window.scrollTo(0,0);
    // fix tabs so that first is visible
    $new_page.find('a[data-toggle=tab]').tab_fixer();

};
// animate in
Elucidat.prototype._animate_out = function ( $old_page, finished_function ) {
    // first look for any items with the animation classes
    var context = this;
    var longest_duration = 0;

    var $animated_elements = $old_page.find('[data-animation]');

    // we need to work out which has the slowest transition
    // our transition starts at t-minus the slowest transition
    $animated_elements.each(function () {
        var $item = $(this);
        var attr = $item.attr('data-animation').split('|');
        var out_style = ( attr[3] && attr[3] != '-' ? attr[3] : null );
        var duration = parseFloat( attr[4] && attr[4] != '-' ? attr[4] : 0 ) * 1000;

        if (out_style && !$item.hasClass('e-animated-out')) {
            if (duration > longest_duration)
                longest_duration = duration;
        }
    });
    
    // now we have them all - go through and set up - with the right delay 
    $animated_elements.each(function () {
    
        var $item = $(this);
        if (!$item.hasClass('e-animated-out')) {
            //mark as animating
            $item.addClass('e-animated-out');
            // and reget attrs
            var attr = $item.attr('data-animation').split('|');
            var in_style = ( attr[0] && attr[0] != '-' ? attr[0] : null );
            var out_style = ( attr[3] && attr[3] != '-' ? attr[3] : null );
            var duration = parseFloat( attr[4] && attr[4] != '-' ? attr[4] : 0 ) * 1000;
            var out_delay = longest_duration - duration;

            // and then trigger
            setTimeout(function () {
                if (!$item.hasClass('e-animated-out')) {
                    // element
                    $item.removeClass( in_style );
                    $item.css({
                        '-webkit-animation-duration':   duration,
                        '-moz-animation-duration':      duration,
                        'animation-duration':           duration
                    });
                    $item.addClass( out_style );
                    $item.removeClass('e-hide');

                    setTimeout(function () {
                        $item.hide();
                    }, duration);
                }
            }, out_delay); // sending parameter to timeout enabled by conditional js in ../header/header.js
        }
    });

    var finalise = function () {
        
        $old_page.removeClass( context['animation']['in']['style'] );
        $old_page.css({
            '-webkit-animation-duration':   context['animation']['out']['speed'],
            '-moz-animation-duration':      context['animation']['out']['speed'],
            'animation-duration':           context['animation']['out']['speed']
        });
        $old_page.addClass( context['animation']['out']['style'] );

        setTimeout( function () {
            //
            $old_page.hide();
            // run finishing function 
            $old_page.each ( finished_function );

        }, parseFloat(context['animation']['out']['speed'])*1000 - 50 ) ;    
    }

    if ($animated_elements.length && longest_duration) {
        setTimeout(finalise, longest_duration);
    } else {
        finalise();
    }

};Elucidat.prototype._ga_getter = function () {
    try {
        var trackers = ga.getAll();
        var gaTrackers = [];
        for (var i = 0; i < trackers.length; i++) {
            gaTrackers.push(trackers[i].get('name'));
        }
        return gaTrackers;
    } catch(err) {
        throw new Error(err.name + ': ' + err.message);
    }  
}

Elucidat.prototype._set_cookie = function (name, value, days) {
    var expires = '';
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + value + expires + '; path=/';
}

Elucidat.prototype._get_cookie = function (name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) == 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }
    return null;
}
// init navigation
Elucidat.prototype._fix_links = function ( $element ) {
    $element.find('a,button[href]').fix_links( this );

};


// now open up a pre-loaded page
Elucidat.prototype._handle_dates = function ( page_id ) {
    
    if(
            !('localisation' in this.options) 
            || (typeof this.options.localisation !== 'object')) // guards
        return false;
        
    var html = this.pages[page_id ].html;
    
    // grab the current date and figure out the various formating we may have
    var date_obj = new Date();
    var format_data = {
        'yyyy': date_obj.getFullYear().toString(),
        'm'   : (date_obj.getMonth() +1).toString(),
        'd'   : date_obj.getDate().toString()
    }
    format_data['yy'] = format_data['yyyy'].substring(2);
    format_data['mm'] = (format_data['m'].length < 2) ? ("0" + format_data['m']) : format_data['m'];
    format_data['dd'] = (format_data['d'].length < 2) ? ("0" + format_data['d']) : format_data['d'];
    
    var get_date = function(format, format_data){
        format = format.toLowerCase();
        format = format.replace('yyyy', format_data.yyyy);
        format = format.replace('yy', format_data.yy);
        format = format.replace('y', format_data.yyyy);
        format = format.replace('mm', format_data.mm);
        format = format.replace('m', format_data.m);
        format = format.replace('dd', format_data.dd);
        format = format.replace('d', format_data.d);
        
        return format;
    }
    // find your run of the mill current_dates
    if(('date' in this.options.localisation) && 'short' in this.options.localisation['date']){
        html = html.replace('{{current_date}}', get_date(this.options.localisation['date']['short'] , format_data));
    }
    
    // find the more specific current_dates
    var result;
    var format;
    do { // we will need to run this regex repeatedly.
        result = /{{(current_date,.[^}]*)}}/.exec(html);
        if (result) {
            // extract the desired format and apply
            format = result[1].substring(result[1].indexOf(',')+1);
            html = html.replace(result[0], get_date(format, format_data));
        }  
    } while (result);
    
    // save the new html back to the pages container
    this.pages[page_id ].html = html;
};
//These functions are used when a course loads to parse the data passed back from the backend after bookmarking.

//Take the history of the page and work out if the page should be marked as completed.
Elucidat.prototype._set_initial_page_completed_state = function ( page, history ) {
    if (!history) {
        page.completed = false;
        return
    }

    //The backend returns an empty [] array instead of an object.
    if (history.parts && history.parts.length === 0) {
        history.parts = {};
    }

    //Experienced is sent when a page is completed so this should be accurate.
    page.completed = history.experienced;

};

//Take the history of the page and try to work out if the page should be marked as viewed.
Elucidat.prototype._set_initial_page_visited_state = function ( page, history ) {
    if(!history) {
        page.visited = false;
        return;
    }
    //The 'experienced' verb means the page is completed. If it's completed, it must have been viewed.
    page.visited = history.experienced;

    //TODO - backend could send back 'visited' as part of the history object - that would be ace.

    //if the page isn't complete (experienced), we can try and figure out if the page has been viewed...
    if(!history.experienced) {
        //The backend returns an empty [] array instead of an object {}, convert it to empty object in that case for consistency.
        if(history.parts && history.parts.length === 0) {
            history.parts = {};
        }
        //If there are parts in the history, this page is almost certainly visited.
        page.visited = $.isEmptyObject(history.parts) ? false : true;
    }

};Elucidat.prototype._save_history_to_lms = function () {
    var context = this;

    // PageHistoryModel shares a similar structure to Elucidat_Initialiser.prototype._make_bookmark. 
    // If you update it here you might also need an update to that file.
    var PageHistoryModel = function(page){
        if (page === undefined) {
            page = {};
        }

        this.compress(page);
        return this;
    };


    //Scorm 1.2 has a 4096 character limit for suspend data, hence we use horrible 1 letter keys when storing data.
    //e = experienced, v = visited, p = parts, a = answers, s = score, h = history, c = current, r = registration
    PageHistoryModel.prototype.compress = function(page) {

        //Only send either completed or visited. When we decompress the data we can infer that a completed page must have been visited.
        if(page.completed) {
            this.e = 1;
        } else if(page.visited) {
            this.v = 1;
        }
        if(page.answer.length) {
            this.p = {};

            for(var i=0; i<page.answer.length; i++) {
                var answer = page.answer[i];
                this.p[answer.interaction_id] = {
                    s: answer.score,
                    a: []
                };

                for(var j=0; j<answer.answer.length; j++) {
                    //To compress even more we strip the answer text - this means we do loose some data for in course reports/graphs
                    var answerID = (answer.answer[j] + '').split('[:]')[0];
                    this.p[answer.interaction_id].a.push(answerID);
                }
            }
        }
    };

    var history = {
        'h': {},
        'c': context.current_page ? context.current_page: '',
        'r': context.lrs.endpoints[0] ? context.lrs.endpoints[0].registration: ''
    };
    // go through pages and mark visited ones
    for ( var page_id in context.pages ) {
        if(!context.pages.hasOwnProperty(page_id)) {return;}
        var page = context.pages[ page_id ];
        if(page.visited || page.completed) {
            history.h[page_id] = new PageHistoryModel(page);
        }
    }

    if (window.endpoint.mode === 'offline') {
        /**
         * If the JSON is more than the offline SCORM suspend data limit (4000 characters in
         * 1.2 and 2004 2nd edition) then cut out the longest answers until it's below that).
         * This was originally implemented in PD-2437.
         *
         * In later versions of SCORM 2004 the limit is 64K. This was implemented in PD-2549.
         *
         * Because the answer is removed from the page history, it does lead to slightly strange
         * behaviour, where that page is seen by the LMS as visited and completed. This means
         * that the learner is put onto a later page when they resume and will not know that
         * they have to go back and fill in an answer on a previous page.
         *
         * If I make it so that the page is not marked as complete, then it still puts them on a
         * later page, because the later page has a suspend data entry. It also makes the other
         * questions on the page behave as if they haven't been submitted - they are filled in
         * but have to be resubmitted by the learner before the next page is loaded.
         *
         * @param {Object} historyToTruncate
         * @return {Object}
         */
        function truncateHistory(historyToTruncate) {
            var suspendDataLimit = 4000;
            var mode = context.options.scorm_mode;

            if (mode === '2004_3rd' || mode === '2004_4th') {
                suspendDataLimit = 64000;
            }

            var json = JSON.stringify(historyToTruncate);

            if (json.length > suspendDataLimit) {
                var longestAnswer = {
                    length: 0,
                    deleteAnswer: function () {
                        return historyToTruncate;
                    }
                };

                $.each(Object.keys(historyToTruncate.h), function (index, key) {
                    var questions = historyToTruncate.h[key] && historyToTruncate.h[key].p;

                    if (!questions) {
                        return;
                    }

                    $.each(Object.keys(questions), function (questionIndex, questionKey) {
                        // Although answers is an array, in practice it only has multiple elements
                        // if it is a multiple answer checkbox question, not a free text field,
                        // which are the ones that could be really long.
                        var answers = questions[questionKey].a;

                        if (answers[0].length > longestAnswer.length) {
                            longestAnswer = {
                                length: answers[0].length,
                                /**
                                 * Delete this answer from the history object.
                                 * Only invoked if the answer is the longest one.
                                 */
                                deleteAnswer: function () {
                                    // create new variable to avoid eslint warning
                                    var historyToDeleteFrom = historyToTruncate;
                                    delete historyToDeleteFrom.h[key].p[questionKey];

                                    return historyToDeleteFrom;
                                }
                            };
                        }
                    });
                });

                // Recurse in case it's still over 4000 chars
                return truncateHistory(longestAnswer.deleteAnswer());
            }

            return historyToTruncate;
        }

        history = truncateHistory(history);
    }

    setTimeout(function () {
        context.options.lms.SetSuspendData( JSON.stringify( history ));
    },50);
};

// take json from a loaded url and open the page
Elucidat.prototype._load_json = function ( json_object ) {
    // if navigation is not in place, pause until it is
    var context = this;
    if (!this.navigation_loaded) {
        if (this.navigation_attempts < 100) {
            this.navigation_attempts++;
            setTimeout( function () {
                context._load_json( json_object );
            }, 50);
        }
        return false;
    }

    // cache the data for the next request
    if ( this.pages[ json_object.page_id ] == undefined ) {
        return false;
    }
    // reverse the html to deobsfucate it
    this.pages[ json_object.page_id ].html = json_object.lmth.reverse();
    // now config / progress vars
    this.pages[ json_object.page_id ].loaded = true;
    // one control for navigation progress
    this.pages[ json_object.page_id ].allowed = true;
    // and a second one for rules
    this.pages[ json_object.page_id ].allowed_by_rule = true;
    // how the page should complete
    this.pages[ json_object.page_id ].completed_by = json_object.completed_by ? json_object.completed_by : 'viewed';
    //this.pages[ json_object.page_id ].tracking_type = json_object.tracking_type ? json_object.tracking_type : null;
    this.pages[ json_object.page_id ].content_id = json_object.content_id;

    // preview only storage of editable and comment data
    if (json_object.comments)
        this.pages[ json_object.page_id ].comments = json_object.comments;

    // now open the page
    this._open_page ( this.pages[ json_object.page_id ] );
   
};

// load a url
Elucidat.prototype._load_href = function (url) {
    // do not allow two overlapping calls to load pages - the sequence all breaks
    if (this.navigating == 'loading' || this.navigating == 'opening') 
        return false;
    this.navigating = 'loading';
    // IF the url doesn't have an extension - the extension should be js
    // IF the url is .json - it came from the history and needs converting to .js
    var url_parts = url.split("?");

    var url_base = url_parts[0];
    var url_base = url_base.replace('.json','').replace('.js','')+'.js';

    var url_query_string = "";
    if (typeof url_parts[1] !== 'undefined') {
        url_query_string = url_parts[1];
    }

	//console.log("Elucidat.prototype._load_href options: ");
	//console.log(this.options);

	if(
		typeof this.options.assets_token !== "undefined" &&
		this.options.assets_token !== null &&
		this.options.assets_token.length &&
        url_query_string.indexOf("assets_token") === -1
	) {
        if (url_query_string) {
            url_query_string = url_query_string + "&assets_token=" + this.options.assets_token;
        }
        else {
            url_query_string = "assets_token=" + this.options.assets_token;
        }
	}

	url = url_base + "?" + url_query_string;

	// console.log('_load_href',url);
	// console.log('assets token index', url.indexOf("assets_token"));
	//

    if (window.location.protocol == "file:" && xhr2) {
        if (typeof this.options.loader == "object")
            this.options.loader.load('script',url);

    } else {
        $.ajax({
            url: url,
            dataType: 'jsonp',
            jsonp: 'callback',
            jsonpCallback: 'e._load_json'
        });
    }
};

//When exiting a course send terminate to lms
Elucidat.prototype.unload = function () {
    var c = e.elucidat;
    if (!c.options || !c.options.lms) {
        return undefined;
    }
    // apparently there are some LMS's that are not compliant that need a commit before a terminate but calling commit and terminate in quick succession meant terminate wasn't registering.
    // c.options.lms.Commit();

    c.options.lms.Terminate();

    //iOS does not support beforeunload so use pagehide instead
    var isOnIOS = navigator.userAgent.match(/iPad/i)|| navigator.userAgent.match(/iPhone/i);
    var eventName = isOnIOS ? "pagehide" : "beforeunload";
    //Unbind this event so it isn't called again.
    $(window).off(eventName, e.elucidat.unload);
    // return undefined to ensure this works in Firefox when called from onbeforeunload.
    return undefined;
};

// load a url
Elucidat.prototype.load = function () {
    // load the app
    var c = this;
    // set the passing score in the SCORM interface
    if (c.options.lms) {
        setTimeout(function () {
            c.options.lms.SetScoreThreshold( c.options.global_pass_rate / 100 );
            c.options.lms.SetCompletionThreshold( c.options.global_completion_rate / 100 );
        },50);
        
        // make sure window unloading terminates lms connection
        /*
        window.onbeforeunload = function() {  
            if (c.options.lms.SetExit){
                if(c.progress == 1)
                    // The SCORM runtime reference advises using '' to prompt the LMS to create a new session next time Rounds
                    // We however need the LMS to remember the users registation ID so can track attempts, 'logout' should achive this in most LMSes
                    c.options.lms.SetExit("logout");
                else
                    c.options.lms.SetExit("suspend");
                
            }
            c.options.lms.Commit(); 
            c.options.lms.Terminate();
        };*/
        
        //iOS does not support beforeunload so use unload instead
        var isOnIOS = navigator.userAgent.match(/iPad/i)|| navigator.userAgent.match(/iPhone/i);
		var eventName = isOnIOS ? "pagehide" : "beforeunload";
        //fallback for ie8, check if addeventlistener is available, if not use attachEvent
        $(window).on(eventName, e.elucidat.unload);
    }

    // the true forces the URL to be loaded ( subsequent calls are tested )
    c._load_href( c.options.homepage_url );
    // then do lms attempted call
    c.lrs.queue ({
        'url': c.lrs.activity_id,
        'verb': 'attempted',
        'duration': 0,
        'course_name': this.course_name
    });
};

// init navigation
Elucidat.prototype._init_navigation = function ( $element ) {
    if($element) {
        this.$nav_container = $element.find('span#navigation_html').parent();
        $element.find('span#navigation_html').remove();
    } else if(this.$nav_container) {
        this.$nav_container.empty();
    }
    
    // Call add_lang.js in order to add the language code to the HTML
    $('html').add_lang_attr();

    var template, $clone, $set;
    // now for each item, we iterate through 
    for (var page_id in this.pages) {

        // don't make items hidden by question pool
        //console.log(this.pages[ page_id ].name, this.pages[ page_id ].hidden, this.pages[ page_id ].in_menu)
        if (!this.pages[ page_id ].hidden && this.pages[ page_id ].in_menu) {
    
            // take the nav template, and replace in the write variables
            template = this.navigation_template;
            template = template.replace(new RegExp('\{\{page.name\}\}','g'),this.pages[ page_id ].name);
            template = template.replace('{{page.url}}','{{navigation.'+page_id+'.url}}');
            template = template.replace('{{page.active}}','');
            template = template.replace('{{page.is_section}}', (this.pages[ page_id ].is_section ? 'is_section e-is-chapter' : '')); // switching to new name - chapter
            template = template.replace('{{page.sub_pages}}', (this.pages[ page_id ].has_children ? '<ul></ul>' : ''));
            // 
            // create empty set
            $set = $();
            // if this is a submenu
            if (this.pages[ page_id ].parent) {
                // 
                this.pages[ this.pages[ page_id ].parent ].nav_item.each(function () {
                    // make a clone (in case there are several)
                    $clone = $( template );
                    // add it to the jquery set
                    $set = $set.add( $clone );
                    // append to the the ul
                    $(this).find('ul').append( $clone );

                });
            // otherwise top level
            } else {

                this.$nav_container.each(function () {
                    // make a clone (in case there are several)
                    $clone = $( template );
                    // add it to the jquery set
                    $set = $set.add( $clone );
                    // append to main nav
                    $(this).append ( $clone );
                });
            }

            this.pages[ page_id ].nav_item = $set;

            // mark page as completed, if it is
            if ( this.pages[ page_id ].completed )
                this.pages[ page_id ].nav_item.addClass('completed');

        }
    }

    // event handler to say that page is about to change
    $('body').trigger('elucidat.navigation.loaded', [ this.pages, this.$nav_container ]);
    
};

Elucidat.prototype._load_navigation = function ( json_object ) {

    var achievement;

    if (json_object.pages) {
        for ( var page_id in json_object.pages ) {
            if(!json_object.pages.hasOwnProperty(page_id)) continue;

            achievement = json_object.pages[ page_id ].a ? json_object.pages[ page_id ].a.replace(/[^a-z0-9]/gi,'') : null;

            this.pages [ page_id ] = { 
                'page_id': page_id, 
                'page_type': json_object.pages[ page_id ].b,
                'nav_item': false,
                'links_to_page': [],
                'loaded': false,
                'hidden': false,
                'name': json_object.pages[ page_id ].n,
                'show_if': json_object.pages[ page_id ].r ? json_object.pages[ page_id ].r : false,
                'url': json_object.url_format.replace('%s',page_id),
                'is_section': json_object.pages[ page_id ].s ? true : false,
                // inverted for smaller file
                'in_menu': json_object.pages[ page_id ].m ? false : true,
                'page_lock': json_object.pages[ page_id ].l ? true : false,
                'auto_progress': json_object.pages[ page_id ].u ? true : false,
                'is_objective': json_object.pages[ page_id ].o ? true : false,
                'has_children': json_object.pages[ page_id ].d ? true : false,
                'parent': json_object.pages[ page_id ].p ? json_object.pages[ page_id ].p : null,
                'children': [],
                'has_score': json_object.pages[ page_id ].c ? true : false,
                'send_score': json_object.pages[ page_id ].e ? true : false,
                'score': null,
                'completed': false,
                'visited': false,
                'completed_by': json_object.pages [page_id ].v ? json_object.pages [page_id ].v : 'viewed',
                'weighting': json_object.pages[ page_id ].w ? json_object.pages[ page_id ].w : 50,
                'achievement': achievement,
                'answers': null,
                'answer': null, // placeholder for learner response
                // this is used to cycle through position - i.e. find next and previous buttons
                'position': this.page_order.length,
                // this displays the count in the page
                'position_label': this.page_order.length,
                'completable_sections' : null
            };

            // child pages - mark against parent
            if (this.pages[ page_id ].parent && this.pages[ this.pages[ page_id ].parent ]) {
                this.pages[ this.pages[ page_id ].parent ].children.push( page_id );

                // if parent is hidden, child is too
                if ( !this.pages[ this.pages[ page_id ].parent ].in_menu )
                    this.pages[ page_id ].in_menu = false;
            }

            json_object.pages[ page_id ].id = page_id;
            this.question_pools._add_page(json_object.pages[ page_id ]);


            // timers
            // this could be made more readable to be helpful
            if (json_object.pages[ page_id ].t)
                this.pages [ page_id ].timers = json_object.pages[ page_id ].t;

            // achievement marking if appropriate
            // and check for scores - scores need dividing by 100

            var pageHistory = this.options.history[page_id];
            var answersFromHistory = [];

            if(typeof pageHistory === 'object') {

                //pageHistory contains multiple objects (each representing a part).
                $.each(pageHistory.parts, function(i, obj) {
                    var answerObj = {
                        answer : obj.answers,
                        interaction_id: i,
                        score: obj.score
                    };

                    answersFromHistory.push(answerObj);
                });

            }

            this.pages[ page_id ].answer = answersFromHistory;
            this.pages[ page_id ].answers = this.options.answers[ page_id ] || {};

            var completedBy = this.pages[page_id].completed_by;
            var numQuestionsInPage = answersFromHistory.length;
            if(numQuestionsInPage > 0 && (completedBy === 'any-score' || completedBy === 'correct-score' )) {
                // Assuming this is a scored page, set the page score based on individual answer scores
                // possible page scores are:
                // [0]    if all questions were answered incorrectly
                // [1]    if all questions were answered correctly
                // [0.5]  if some but not all are correct or partially correct

                // sum up how much score the learner accumulated for this page (one page can have more than one question)
                // score per question is same as above
                var score = 0;
                for (var i = 0; i < numQuestionsInPage; i++) {
                    if(answersFromHistory[i].score) {
                        score += answersFromHistory[i].score;
                    }
                }

                if (score === numQuestionsInPage) {
                    // the maximum possible score is 1 per question
                    // if our score matches the number of questions it means everything was answered correctly

                    // !important note:
                    // if for some reason learner has more points than there are questions in the page this will assume something's wrong and learner gets 0.5
                    // how could learner have more points than there are question? good question, see https://elucidat.atlassian.net/browse/MAINT-18
                    this.pages[ page_id ].score = 1;
                } else if (score !== 0) {
                    // if not everything was correct but score is not 0 it means page is partially correct

                    if(completedBy === 'correct-score') {
                        // if the page completed_by is 'correct-score' it means learner gets no points for partially correct pages
                        this.pages[ page_id ].score = 0;
                    } else {
                        // otherwise they get half a point for a partially correct page
                        this.pages[ page_id ].score = 0.5;
                    }

                } else {
                    // this means learner failed all questions on the page
                    this.pages[ page_id ].score = 0;
                }

            }

            // disable links if we are not allowed into the future
            this.page_order.push( page_id );

            // and cache list of achievements
            if (achievement) {
                this.achievements [ achievement ] = page_id;
                // and mark if page is completed
                if (this.options.history.hasOwnProperty( page_id ))
                    this._achievement( achievement );
            }

            this._set_initial_page_completed_state(this.pages[ page_id ], this.options.history[page_id] );
            this._set_initial_page_visited_state(this.pages[ page_id ], this.options.history[page_id] );
        }

        // now mark the question pool pages
        this._shuffle_question_pools();

        // and save template
        this.navigation_template = json_object.template;
        this.navigation_loaded = true;
    }
    
};

Elucidat.prototype._make_page_active = function ( page_id ) {

    var c  = this;
    // this manages the navigation, and next and previous links
    // find out the next and previous links
    
    // pages that are hidden - need to be ignored and cycled past
    // pages that are not allowed but not hidden are valid, no should be a null

    // if(c.should_shuffle_pools) {
    //     c.should_shuffle_pools = false;
    //     c._shuffle_question_pools(true);
    // }

    // get current page for links
    var current_page = c.pages[ page_id ];
    var current_position = current_page.position;

    var userIsOnFirstPage = page_id === c.page_order[0];
    var userIsOnLastPage = page_id === c.page_order[c.page_order.length - 1];

    // start from next page
    var next_position = current_position + 1;
    // set to null
    c.next_page = null;

    var ignoreNavigationRules = getShouldIgnoreNavigationRules();

    /*
     * Note - the button--disabled class
     * is used here rather than the disabled attribute
     * so that tooltips can still work for the button.
     * 
     * The CSS for the class should give sufficient
     * indication for the user that the button is inactive
     * or disabled.
     */
    var classToDisableButton = 'button--disabled';

    // now loop
    while ( next_position < c.page_order.length ) {
        var nextPage = c.pages[c.page_order[next_position]]
        // go through until we find a page that is not hidden
        if ( !nextPage.hidden ) {
            // the page should be hidden if the section is hidden too
            if ( 
                !nextPage.parent
                || !c.pages[ nextPage.parent ].hidden
            ) {
                c.next_page = (nextPage.allowed && nextPage.allowed_by_rule ? c.page_order[ next_position ] : false );
                break;
            }

            if (
                (
                    nextPage.allowed && nextPage.allowed_by_rule
                ) || ignoreNavigationRules
            ) {
                c.next_page = c.page_order[ next_position ];
            } else {
                c.next_page = false;
            }
        }
        next_position++;
    }

    // start from next page
    var prev_position = current_position - 1;
    // set to null
    c.previous_page = null;
    // now loop
    while ( prev_position >= 0 ) {
        // go through until we find a page that is not hidden
        if ( !c.pages[ c.page_order[prev_position] ].hidden ) {
            if ( !c.pages[ c.page_order[prev_position] ].parent || !c.pages[ c.pages[ c.page_order[prev_position] ].parent ].hidden ) {
                if (
                    (
                        c.pages[c.page_order[prev_position]].allowed &&
                        c.pages[c.page_order[prev_position]].allowed_by_rule
                    ) || ignoreNavigationRules
                ) {
                    c.previous_page = c.page_order[prev_position];
                } else {
                    c.previous_page = false;
                }
                break;
            }
        }
        prev_position--;
    }
    // if next of previous is not allowed - update the classes to show if link is active
    // and update elements that reference this URL

    var disableInPageButton = function ($elementToTarget) {
        $elementToTarget.addClass(classToDisableButton);
        $elementToTarget.find('i').addClass('ti-lock');
        $elementToTarget.attr('aria-disabled', 'true');

        var $toolTipData = $elementToTarget.data('tooltip');
        if ($toolTipData) {
            $elementToTarget.attr('aria-label', $toolTipData);
        }
    }

    var enableInPageButton = function ($elementToTarget) {
        $elementToTarget.removeClass(classToDisableButton);
        $elementToTarget.find('i').removeClass('ti-lock');
    }

    if(!ignoreNavigationRules) {
        setTimeout(function () {
            var $next_page_link = $('.e-next-disable,[data-role="pager-next"]');
            var $prev_page_link = $('.e-prev-disable,[data-role="pager-previous"]');
            // the next link might not be to 'next' -- in which case we should 
            // if a next or previous has been made to a particular page - then we need to look up that page
            // otherwise we look for the next page
            var next_page_link = $next_page_link.find('a[data-page-id]').attr('data-page-id');
            var prev_page_link = $prev_page_link.find('a[data-page-id]').data('data-page-id');
    
            // In page button (link) which can be used as a page progresser.
            var $inPageButton = $('.e-button--link[data-showtooltip="1"]');
    
            if (prev_page_link && c.pages[ prev_page_link ]) {
                if (c.pages[ prev_page_link ].allowed && c.pages[ prev_page_link ].allowed_by_rule)
                    $prev_page_link.removeClass('disabled');
                else
                    $prev_page_link.addClass('disabled');
            } else {
                // update based on 'next or previous' link
                if (c.previous_page)
                    $prev_page_link.removeClass('disabled');
                else if (userIsOnFirstPage) {
                    $prev_page_link.hide();
                }
                else
                    $prev_page_link.addClass('disabled');
            }
    
            if (next_page_link && c.pages[ next_page_link ]) {
                if (c.pages[next_page_link].allowed && c.pages[next_page_link].allowed_by_rule) {
                    $next_page_link.removeClass('disabled');
    
                    if ($inPageButton) {
                        enableInPageButton($inPageButton);
                    }
                }
                else {
                    $next_page_link.addClass('disabled');
                    if ($inPageButton) {
                        disableInPageButton($inPageButton);
                    }
                }
            } else {
                // update based on 'next or previous' link
                if (c.next_page) {
                    $next_page_link.removeClass('disabled');
                    if ($inPageButton) {
                        enableInPageButton($inPageButton);
                    }
                }
                else if (userIsOnLastPage) {
                    $next_page_link.hide();
                }
                else {
                    $next_page_link.addClass('disabled');
    
                    if ($inPageButton) {
                        disableInPageButton($inPageButton);
                    }
                }    
            }
        }, 50);
    }

    $('.disabled_button_tooltip').on('click', function () {
        var $this = $(this);
        var hasCompletedCurrentPage = c.pages && c.current_page && c.pages[c.current_page].completed;
        var showTooltipData = $this.attr('data-showtooltip');
        if (showTooltipData && showTooltipData === '1' && !hasCompletedCurrentPage) {
            $this.tooltip_extended({
                trigger: 'click'
            });
        }
    });

    // also the status (how far through the course we are)
    $('output.navigation_current').text( c.pages[ page_id ].position_label );
    $('output.navigation_total').text( c.total_pages );
    var perc_progress = (100 / c.total_pages * c.pages[ page_id ].position_label);
    $('output.navigation_percentage').text( Math.round(perc_progress) + '%' );
    // this drives course progress bars
    $('.navigation_percentage .bar').css( 'width', perc_progress + '%' );

    // finally we need to mark the navigation correctly
    var $current = c.pages[ page_id ].nav_item;
    if ($current.length) {
        this.$nav_container.find('li').removeClass('section_active').removeClass('active');
        // mark current one
        $current.addClass('active');
        $current.each(function () {
            $(this).parent().closest('li').addClass('section_active');
        });
        if (c.pages[ page_id ].is_section)
            $current.addClass('section_active');
    } else {
        // if the page is not in the nav menu (in_menu is false), remove classes section_active and active from nav menu
        this.$nav_container.find('li').removeClass('section_active').removeClass('active');
        // then add section_active to the current page's parent li to ensure the section is showing
        this.$nav_container.find('li a[data-page-id="' + c.pages[ page_id ].parent + '"]').parent('li').addClass('section_active');
    }

    // and timers
    // start the page timer
    //
    var page_limit = null, page_redirect = null;
    // if page has a timer
    if (c.pages[ page_id ].timers && c.pages[ page_id ].timers.p) {
        // time limit
        page_limit = c.pages[ page_id ].timers.p.s;
        // redirect
        if (c.pages[ page_id ].timers.p.r)
            page_redirect = c.pages[ page_id ].timers.p.r;
    }
    // start page timer
    c.timer.page_start ( page_id, page_limit, page_redirect );

    // start the chapter timer
    if (c.pages[ page_id ].is_section || c.pages[ page_id ].parent) {
        //
        var chapter_limit = null, chapter_redirect = null;
        var section_id = c.pages[ page_id ].is_section ? page_id : c.pages[ page_id ].parent;
        // if page has a timers
        if (c.pages[ section_id ].timers && c.pages[ section_id ].timers.c) {
            // time limit
            chapter_limit = c.pages[ section_id ].timers.c.s;
            // redirect
            if (c.pages[ section_id ].timers.c.r)
                chapter_redirect = c.pages[ section_id ].timers.c.r;
        }
        c.timer.chapter_start ( section_id, chapter_limit, chapter_redirect );
    }
};
// load a url/
Elucidat.prototype._complete_page = function ( current_page ) {

    var context = this;
    // 
    var already_completed = this.pages[ current_page ].completed;
    this.pages[ current_page ].completed = true;
    // get progress
    this._get_progress();
    // and send to LMS
    if (!this.sent_termination) {
        setTimeout(function () {
            context.options.lms.SetProgress ( context.progress );
            if (context.options.lms.SetSessionTime)
                context.options.lms.SetSessionTime ( context.timer.session_time );
        },50);
    }

    // if this is a milestone, add an anchievement class to the body and trigger an event
    if (this.pages[ current_page ].achievement){
        this._achievement( this.pages[ current_page ].achievement );
    }

    // Any answers supplied by the page come in the answers array
    // IF there is only one answer, then the page is thought of as the question
    // IF more than one, we complete (and score the page, and then send separate statements for each interaction on the page)
    // repackage the data for the xapi statement
    var xapi_data = {
        'url': this.lrs.activity_id,
        'verb': 'experienced', //this.pages[ current_page ].has_score || this.pages[ current_page ].answer ? 'answered' :
        'course_name': this.course_name,
        'page_name': this.pages[ current_page ].name,
        'page_url': current_page, // this.lrs.activity_id'j+'/'+
        'progression': context.progress ? context.progress * 100 : 0
    };

    // if answers - queue the experienced verb for the page - unless the page is completed by "viewed".
    // (if the page is completed by viewed, experienced will have been sent as soon as the learner landed on the page.)
    if (this.pages[ current_page ].answer.length && this.pages[current_page].completed_by !== "viewed") {
        context.lrs.queue ($.extend({},xapi_data));
    }

    // and send to Elucidat (score corrected to be out of 100)
    if ( this.pages[ current_page ].has_score) {
        xapi_data.verb = 'answered';
        if (this.pages[ current_page ].score !== null) {
            xapi_data.score = this.pages[ current_page ].score * 100;
        }
    }

    // put the answer stats into the page, if there are answers to be had
    if (this.pages[ current_page ].answer.length) {
        // if many answers - queue the experienced verb for the page - unless the page is completed by "viewed".
        // (if the page is completed by viewed, experienced will have been sent as soon as the learner landed on the page.)
        if (this.pages[ current_page ].answer.length > 1 && this.pages[current_page].completed_by !== "viewed") {
            context.lrs.queue (xapi_data);
        }

        function isValidUuid (string) {
            return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(string);
        }

        for (var i = 0; i < this.pages[ current_page ].answer.length; i++ ) {
            var currentAnswer = this.pages[ current_page ].answer[i];
            var data_dup = jQuery.extend({}, xapi_data); 
            data_dup.verb = 'answered';
            var props = ['answer','choices','interaction_type','l','page_name','scale','source','target'];
            for (var p in props) {
                if (currentAnswer[ props[p] ]){
                    data_dup[ props[p] ] = currentAnswer[ props[p] ];
                }
            }
            if($.isArray(data_dup.answer)) {
                data_dup.answer = data_dup.answer.join('[,]');
            }
            data_dup.answer = encodeURIComponent(data_dup.answer);
            // score needs to be scaled
            if (currentAnswer.score !== null) {
                data_dup.score = currentAnswer.score * 100;
            }
            // and add to the page id
            if (this.pages[ current_page ].answer.length && currentAnswer.interaction_id) {

                data_dup.page_url += '/'+currentAnswer.interaction_id;
            }

            // We then find that form on the page.
            var form = $("form[id*=" + currentAnswer.interaction_id + "]")[0];

            // For most question types, the form tag has the correct ID, but for free text elements
            // and sortable image cards, the ID we're looking for is at the end of the ID of child
            // elements (e.g. textareas or a tags) and the form element we want is a parent of it.
            // See https://elucidat.atlassian.net/browse/PD-2641
            // See https://elucidat.atlassian.net/browse/PD-2523
            if (!form) {
                form = $("[id$=" + currentAnswer.interaction_id + "]").parents('form')[0];
            }

            var $form = $(form);

            if((typeof feature_xapi_tagging !== 'undefined') && feature_xapi_tagging) {
                var tags = $form.data("question-tags");
                if (tags) {
                    data_dup.tags = tags;
                }
                
                // Users can choose a to set a question-title using the 'Question and answer recording' section of the edit panel, 
                // we look to see if they have done this previously and if not we do some calculations to find the most appropriate text
                var savedTitleOnDom = $form.data("question-title");
                if (savedTitleOnDom) {
                    data_dup.title = savedTitleOnDom;
                } else {
                    data_dup.title = ""
                }
            }

            if ((typeof learner_service_2021_in_use !== 'undefined') && learner_service_2021_in_use) {
                // We then find that form on the page
                var uuidOnDom = $form.data('uuidQuestion');
                // And if it isn't just a generic UUID we include it in statement so it can be used later
                if (uuidOnDom && isValidUuid(uuidOnDom)) {
                    data_dup.uuid = uuidOnDom;
                }
            }

            var callback_function = function ( interaction_id ) {
                return function(data) {
                    if (!data.answers || !interaction_id) return;

                    context.pages[ current_page ].answers[interaction_id] = data.answers;
                };

            }(currentAnswer.interaction_id);

            // queue to LRS
            context.lrs.queue (data_dup, callback_function );
        }

    }
    //JB - I can't see why this exists. I'm leaving it here, commented out in case there is some bug in the future tracked down to this part of the code.
    //The verb 'experienced' is already sent when a page is loaded - sending it again here will cause duplicate page views in the analytics section.
    else {
        context.lrs.queue (xapi_data);
    }
    

    // now queue to the xapi
    //if (this.pages[ current_page ].has_score) {
    // if this is a page with a score...        
    // if the page has a parent that is an objective
    var current_page_obj = context.pages[current_page];
    var parent_code = current_page_obj.parent;
    var parent_object = context.pages[ parent_code ];
    var page_answer = [];
    var answers = '';
    if (current_page_obj.answer ) {
        // record answer
        // split into parts
        for(var i=0; i<current_page_obj.answer.length; i++) {
            var full_answer_obj = current_page_obj.answer[i];
            var answer_obj = full_answer_obj.answer;
            var page_answer_type = full_answer_obj.interaction_type;
            var page_answer_pattern = context.pages[ current_page ].answer[0].correct_responses_pattern;
            
            //variables in case its a multi response
            var formatted_response = '';
            var answer_string = '';
            if(full_answer_obj.hasOwnProperty("choices") && full_answer_obj.choices.length === 2 && full_answer_obj.choices[0].description['en-US'].toUpperCase() === 'TRUE' && full_answer_obj.choices[0].id === 1 && full_answer_obj.choices[1].description['en-US'].toUpperCase() === 'FALSE' && full_answer_obj.choices[1].id === 2){
                //MULTI REPSONSE TRUE/FALSE NEEDS TO HANDLE DIFF 
                formatted_response = String(full_answer_obj.answer[0]).replace(/\[:\]/g, "_");
                if(formatted_response.indexOf('True') < 0 && formatted_response.indexOf('False') < 0){
                    if(formatted_response === '1'){
                        formatted_response = formatted_response + '_True';
                    }else if(formatted_response === '2'){
                        formatted_response = formatted_response + '_False';
                    }
                }
                answer_string = full_answer_obj.interaction_id + '[:]' + formatted_response;
                page_answer.push(answer_string);
            }else{
                // if there are choices, then we'll record real answer as well as score
                var page_choices;

                if (current_page_obj.answer[i].choices) {
                    page_choices = current_page_obj.answer[i].choices;
                } else if (current_page_obj.answer[i].scale) {
                    page_choices = current_page_obj.answer[i].scale;
                } else {
                    page_choices = false;
                }


                if (page_choices) {
                    for (var c = 0; c < page_choices.length; c++) {
                        for (var a = 0; a < answer_obj.length; a++) {
                            if (page_choices[c].id == answer_obj[a]) {
                                var sanitised_answer = page_choices[c].description['en-US'].replace(/[^a-zA-Z 0-9]+/g,"").replace(/\s+/g, " ");
                                answer_obj[a] += '[:]'+sanitised_answer;
                            }
                        }
                    }
                }
                page_answer.push(answer_obj.join('[,]'));
            }

            
        }
        // now join back
        answers = page_answer.join('[,]');
    }
    
    var completion_status = 'neutral';    
    
    if (this.pages[ current_page ].has_score) {
        completion_status = current_page_obj.score ? 'passed' : 'failed';
    }
    if(current_page_obj.answer.length){
        
        // if(!page_answer_pattern || page_answer_pattern === ''){
        //     page_answer_pattern = 'id__answer';
        // }
        
        if(context.options.allow_retakes || (!context.options.allow_retakes && !already_completed)){
            if(current_page_obj.questions){
                for (var i = 0; i < current_page_obj.questions.length; i++) {
                    var current_question = current_page_obj.questions[i];
                    var outcome = 'neutral';
                    if(current_question.outcome === 'correct'){
                        outcome = 'passed';
                    }else if(current_question.outcome === 'wrong'){
                        outcome = 'failed';
                    }
                    var interaction_type = current_question.interaction_type;
                    if(this.options.lms.mode !== "2004" && interaction_type === 'long-fill-in'){
                        interaction_type = 'fill-in';
                        //theres no long-fill-in in 1.2
                    }
                    var question_correct_pattern = current_question.correct_responses_pattern;
                    var formatted_learner_response = returnFormattedLearnerResponse(this.options.lms.mode, current_question).replace(/'/g, "\'").replace(/"/g, '\"');
                    var correct_resp = current_question.correct_responses_pattern;
                    if(!correct_resp){
                        correct_resp = 'survey';
                    }
                    var objective_obj  = {
                        objective_name: parent_code,
                        outcome: 'completed',
                        score: current_question.score,
                        min: 0,
                        max: 0,
                        description: parent_object ? parent_object.name : '' 
                    };
                    var interaction_obj = {
                        interaction_name: current_page + '_' + current_question.interaction_id,
                        objective_name: parent_code,
                        completion_status: outcome,
                        learner_response: formatted_learner_response,
                        description: context.findQuestionDescription(current_page_obj, 0),
                        interaction_type: current_question.interaction_type,
                        correct_responses_pattern: correct_resp,
                        weighting: current_page_obj.weighting
                    };
                    context.reportToScorm(context, parent_code, parent_object, objective_obj, interaction_obj);
                }
            }else{
                var objective_obj = {
                    objective_name: parent_code,
                    outcome: 'completed',
                    score: 0,
                    min: 0,
                    max: 0,
                    description: parent_object ? parent_object.name : '' 
                };
                var interaction_obj = {
                    interaction_name: current_page,
                    objective_name: parent_code,
                    completion_status: completion_status,
                    learner_response: answers,
                    description: context.findQuestionDescription(current_page_obj, 0),
                    interaction_type: page_answer_type,
                    correct_responses_pattern: page_answer_pattern,
                    weighting: current_page_obj.weighting
                };
                context.reportToScorm(context, parent_code, parent_object, objective_obj, interaction_obj);
            }
            //====
        }
    }
    // save history to lms, if in offline mode
    if (this.options.mode == 'offline') {
        setTimeout(function () {
            context._save_history_to_lms();
        }, 100);
    }

    // and add a class to the body
    var $body = $('body');
    $body.addClass('page_completed');

    $('.disabled_button_tooltip').data('showtooltip', 0);

    $body.one('elucidat.page.complete', function () {
        if ('_make_bookmark' in context.options.loader) {
            var bookmarkData = context.options.loader._make_bookmark();
            context.options.loader._set_bookmark(bookmarkData);
        }
    });

    $body.trigger('elucidat.page.complete', [ context.pages[ current_page ], $body.find('#paw') ]);


    return true;
};

Elucidat.prototype.reportToScorm = function (context, parent_code, parent_object, objective_reporting_obj, interaction_reporting_obj) {
    //objective_reporting_obj = objective_name, outcome, score, min, max, description
    //interaction_reporting_obj = interaction_name, objective_name, completion_status, learner_response, description, interaction_type, correct_responses_pattern, weighting
    if ( parent_code && parent_object.is_objective && context.options.lms.SetInteraction) {
        
        setTimeout(function () {
            // create objective if not created already
            // if the parent is a section AND an objective (we initialise the objective)
            // find all of the scored children of the objective
            var obj_possible_score = objective_reporting_obj.max;
            var obj_achieved_score = objective_reporting_obj.score;
            var obj_children = parent_object.children;

            for (var i = 0; i < obj_children.length; i++) {
                var child = context.pages[ obj_children[i] ];
                if (child.has_score) {
                    var weighting = child.weighting;
                    obj_possible_score += weighting;
                    obj_achieved_score += weighting * child.score;
                }
            }
            context.options.lms.SetObjective ( parent_code, 'completed', obj_achieved_score, 0, obj_possible_score, parent_object.name );
            // Just passing page_answer[0] for now - we need to refactor
            // how multiple questions on the same page are sent to the LMS
            context.options.lms.SetInteraction ( interaction_reporting_obj.interaction_name, parent_code, interaction_reporting_obj.completion_status, interaction_reporting_obj.learner_response, interaction_reporting_obj.description, interaction_reporting_obj.interaction_type, interaction_reporting_obj.correct_responses_pattern, interaction_reporting_obj.weighting);
        },50);

    } else {

        // send LMS objective if we are a scoring page
        setTimeout(function () {
            context.options.lms.SetObjective ( interaction_reporting_obj.interaction_name, 'completed', objective_reporting_obj.score * interaction_reporting_obj.weighting, 0, interaction_reporting_obj.weighting, interaction_reporting_obj.description );

            if (context.options.lms.SetInteraction) {
                // Just passing page_answer[0] for now - we need to refactor
                // how multiple questions on the same page are sent to the LMS
                // Scorm.prototype.SetInteraction = function ( interaction_name, objective_name, outcome, learner_response, description, interaction_type, correct_response_pattern, weighting )
                context.options.lms.SetInteraction ( interaction_reporting_obj.interaction_name, interaction_reporting_obj.interaction_name, interaction_reporting_obj.completion_status, interaction_reporting_obj.learner_response, interaction_reporting_obj.description, interaction_reporting_obj.interaction_type, interaction_reporting_obj.correct_responses_pattern, interaction_reporting_obj.weighting );
            }
        },50);

    }
};

function returnFormattedLearnerResponse(scorm_type, question_object){
    //types used by elucidat "choice" (questionaire handler, multiple response handler) 
    //"likert" (likert handler), "sequencing" (sorrtable handler), "long-fill-in" (free text handler)
    //"fill-in" (fill blanks handler), "matching" (drag drop handler)
    //scorm 2004 Available types: "true-false", "choice", "fill-in", "long-fill-in", "matching", "performance", "sequencing", "likert", "numeric", "other"
    //for extra info on the scorm standard accepted responses look at p140 of the Runtime document
    //scorm 1.2 Available types : “true-false”, “choice”, “fill-in”, “matching”, “performance”, “sequencing”, “likert”, “numeric”
    //if (this.options.lms.mode === "2004")
    var interaction_type = question_object.interaction_type;
    switch (interaction_type) {
        case 'choice':
        case 'sequencing':
            //supposed to be a list of "short identifier types" (i.e IDs) seperated by a "[,]" p140/141 of runtime doc
            //<short_identifier_type>[,]<short_identifier_type> eg choice1[,]choice2[,]choice3
            //sai needs the text of the question so the punctuation needs stripping so id-1__Your_first_answer[,]id-2__Your_second_answer
            var formatted_answers = []; 
            if (question_object.answer_data) {
                for (var i = 0; i < question_object.answer_data.length; i++) {
                    var answer_id = question_object.answer_data[i].element_id;
                    var choice_info = searchById(question_object.answer_data[i].reference_id, question_object.choices);
                    if (scorm_type === "2004"){
                        formatted_answers.push(answer_id + "__" + choice_info.description['en-US'].replace(/[^a-zA-Z 0-9]+/g,"").replace(/\s+/g, " ").replace(/ /g, "_"));
                    } else {
                        formatted_answers.push(answer_id + "[:]" + choice_info.description['en-US']);
                    }
                }
            }
            return  formatted_answers.join('[,]');
        case 'likert':
            if(scorm_type === "2004"){
                var split_answer = question_object.answer[0].split("[:]");
                var text_answer = split_answer[1].replace(/[^a-zA-Z 0-9]+/g,"").replace(/\s+/g, " ").replace(/ /g, "_");
                return split_answer[0] + "__" + text_answer;
            }else{
                return question_object.answer.join('[,]');
            }
        case 'matching':
        case 'fill-in':
        case 'long-fill-in':
            return question_object.answer.join('[,]');
        default:
            return 'Elucidat Scorm Interaction Error: No recognised interaction type';
    }
}

function searchById(value, array){
    for (var z = 0; z < array.length; z++) {
        if(array[z].id === value){
            return array[z];
        }
    }
}
function searchByText(value, array){
    for (var z = 0; z < array.length; z++) {
        if(array[z].description['en-US'] === value){
            return array[z];
        }
    }
}


Elucidat.prototype.findQuestionDescription = function(page_object, iteration){
    
    /////// REMOVE THIS WHEN IMPLEMENTING THE DESCRIPTION WORK AND UNCOMMENT STUFF BELOW
    return page_object.name;
    //////////////////////////////////////////////////////////
    
    
    // var description = page_object.name;
    // var d = "";
    // //default back to the original default, the page name
    // //first find the form interaction
    // var $interaction = $('form[id*=' + page_object.answer[iteration].interaction_id + ']');
    // if($interaction.length === 1){
    //     //check for the ideal, the correctly marked question Text
    //     var $question_text = $interaction.find("*[data-role='question']");
    //     if($question_text.length > 0){
    //         d = $question_text.first().text();
    //         if(d.length > 0){
    //             return d;
    //         }
    //     }
    // 
    //     //next lets try and find a normal (incorrectly marked) text box in the form
    //     $question_text = $interaction.find(".textWrapper .htmlText");
    //     if($question_text.length > 0){
    //         d = $question_text.first().text();
    //         if(d.length > 0){
    //             return d;
    //         }
    //     }
    // 
    //     //if we reached down here there's no text box within the form element, boohoo,
    //     //so as a fallback let's look for an immediately preceding sibling text element
    //     $question_text = $interaction.prev(".textWrapper");
    //     if($question_text.length > 0){
    //         d = $question_text.first().text();
    //         if(d.length > 0){
    //             return d;
    //         }
    //     }
    // }
    // return description;
}
// load a url
Elucidat.prototype._page_setup_completed_listener = function ( current_page ) {
    // aliases
    var context = this;
    var $page_wrapper = $('div#paw');
    var current_page_id = current_page.page_id;

    // record current page (even if not complete)
    context._set_current_page(current_page_id);

    //If there are no scored or viewable sections this wont have been initialised yet.
    if(current_page.completable_sections === null) {
        current_page.completable_sections = { scored:[], viewed:[] };
    }

    // if completed by opening, and there are no trackable elements
    if ( current_page.completed_by === 'viewed' && (!current_page.completable_sections.scored.length && !current_page.completable_sections.viewed.length)) {
        // page is completed by opening the page - if we have got through this far
        $page_wrapper.off('page_complete');
        // do the completion
        context._complete_page( current_page_id );
        // and stop
        return;
    } else if (current_page.completed_by === 'viewed') {
        // In this case the page is completed by viewing it but we still want to bind an event to capture any answers
        // given by the learner in case they are required for page rule checks later.
        context._complete_page( current_page_id);
    }

    setTimeout(function () {
 


        // now set up listeners
        var completion_sent_already = false;
        // listen out for completions from all of the scorable sections
        // and all viewable sections

        // otherwise we need a completion listener
        $page_wrapper.off('page_complete').on('page_complete', function (e, result) {
            // record for scoring
            // record for scoring
            // record for scoring
            if (result && (result.answers || result.outcome)) {
                // record for scoring
                // if !this.options.allow_retakes only first score is recorded
                if ( context.pages[ current_page_id ].score == null || context.options.allow_retakes || current_page.completed_by == 'correct-score' ) {

                    // IF there is a score already, and this replaces it - we need to flag it - as the result will need to be resent
                    if ( context.sent_result )
                        context.has_retaken_questions = true;

                    // otherwise calculate score
                    if (result.outcome) {
                        if (result.outcome == 'correct')
                            context.pages[ current_page_id ].score = 1;
                        else if (current_page.completed_by !== 'correct-score' && context.options.score_partially_correct && result.outcome && result.outcome == 'partially-correct')
                            context.pages[ current_page_id ].score = 0.5;
                        else
                            context.pages[ current_page_id ].score = 0;
                    } else {
                        if (isNumber(result.score))
                            context.pages[ current_page_id ].score = parseFloat(result.score).between(0,1);

                    }
                    // store interaction type, choices, 
                    if (result.answers)
                        context.pages[ current_page_id ].answer = result.answers;
                    if (result.questions)
                        context.pages[ current_page_id ].questions = result.questions;
                }

                // then work out if page has been completed
                if (current_page.completed_by == 'correct-score') {
                    if (result.outcome && result.outcome == 'correct') {
                        context._complete_page( current_page_id );
                    }
                    // redo navigation rules (as we are allowed to progress now)
                    context._manage_progress();
                } else {
                    // page is completed by any score
                    context._complete_page( current_page_id );
                    // redo navigation rules (as we are allowed to progress now)
                    context._manage_progress();
                }

            // send completion event for normal pages
            } else if (!completion_sent_already) {
                completion_sent_already = true;
                context._complete_page( current_page_id );
                // redo navigation rules (as we are allowed to progress now)
                context._manage_progress();
            }
            
            // if we auto progress - skip to next page
            if (current_page.auto_progress)
                Elucidat.navigate('next');
                
            e.stopPropagation();
        });

        // page is completed by opening ALL PARTS of the page
        var answers = context.pages[current_page_id].answer || [];
        if(!context.pages[current_page_id].questions){
            context.pages[current_page_id].questions = answers.slice(0);
        }
        var questions = context.pages[current_page_id].questions || [];

        $('div#pew').off('section_complete answered').on('section_complete answered', function (e, result) {
            var all_complete = true;
            var all_scored = true;
            var question_result = {};
            var question = $.extend({}, result);
            // if current_page.completed_by == 'viewed-all' - we just need all sections completed -
            // mark this one as complete
            for (var i=0;i<current_page.completable_sections.viewed.length;i++) {
                if (e.type == 'section_complete' && current_page.completable_sections.viewed[i].target === e.target)
                    current_page.completable_sections.viewed[i].completed = true;
                // if not complete - mark as such
                else if (current_page.completable_sections.viewed[i].completed == false)
                    all_complete = false;
            }
            // answered
            for (var i=0;i<current_page.completable_sections.scored.length;i++) {
                if (e.type == 'answered' && current_page.completable_sections.scored[i].target_id === e.target.id) {
                    current_page.completable_sections.scored[i].completed = true;
                    if (result.outcome) {
                        // also record the score for the interaction
                        if (result.outcome == 'correct'){
                            result.score = 1;
                            question.score = 1;
                        }else if (context.options.score_partially_correct && result.outcome && result.outcome == 'partially-correct'){
                            result.score = 0.5;
                            question.score = 0.5;
                        }else if(result.interaction_type === 'likert' && result.outcome === 'neutral' && isNumber(result.score)){
                            result.score = parseFloat(result.score).between(0,1);
                            question.score = parseFloat(result.score).between(0,1);
                        }else{
                            result.score = 0;
                            question.score = 0;
                        }
                    } else {
                        if (isNumber(result.score)){
                            result.score = parseFloat(result.score).between(0,1);
                            question.score = parseFloat(result.score).between(0,1);
                        }
                    }
                    // and make sure the id of the item is in
                    if ($(e.target).attr('id')){
                        result.interaction_id = $(e.target).attr('id').replace(/(pa|pr)_[a-z0-9]+_/i,'');
                        question.interaction_id = $(e.target).attr('id').replace(/(pa|pr)_[a-z0-9]+_/i,'');
                    }

                    // Special Case: Some questions need to keep the little bit after the part code
                    // because they can have multiple questions within the same part.
                    if (
                        result.interaction_id 
                        && result.interaction_type !== 'likert' // exclude likerts
                        && result.interaction_type !== 'long-fill-in' // exclude free text
                        && result.elucidat_type !== 'multiple response' // exclude multi response
                        && result.elucidat_type !== 'swipe away' // exclude swipe cards
                    ) {
                        result.interaction_id = result.interaction_id.replace(/-(.*)/g,'');
                        question.interaction_id = result.interaction_id.replace(/-(.*)/g,'');
                    }
                    
                    if( question.elucidat_type === 'multiple response' ){
                        //multi response in question replace 1, 2 with true, false
                        var new_answers = [];
                        for (var y = 0; y < question.answer.length; y++) {
                            var txt = question.choices[ question.answer[y] - 1 ].description["en-US"];
                            new_answers.push(txt);
                        }
                        question.answer = new_answers;
                        
                        //fix correct responses too
                        if(question.correct_responses_pattern){
                            var new_ca = [];
                            for (var v = 0; v < question.correct_responses_pattern.length; v++) {
                                var txt = question.choices[ parseInt(question.correct_responses_pattern[v])- 1 ].description["en-US"];
                                new_ca.push(txt);
                            }
                            question.correct_responses_pattern = new_ca;
                        }
                    }

                    if(result.interaction_id) {
                        //Check if this specific question has already been answered and remove any previous answer.
                        for (var j = answers.length - 1; j >= 0; j--) {
                            var loopedAnswer = answers[j];

                            if (loopedAnswer.interaction_id === result.interaction_id) {
                                answers.splice(j, 1);
                                questions.splice(j, 1);
                            }
                        }
                    } else {
                        //if there is no interaction_id (e.g. the question is in a form without an id) then there cant possibly be multiple
                        //questions on the page and we can just empty the array rather than trying to maintain a list of answers.
                        answers = [];
                        questions = [];
                    }
                    // and store answer
                    ///// HERE -- JAMES --- LOOK HERE!!! Then delete this comment.
                    answers.push(result);
                    questions.push(question);
                // if not complete - mark as such
                } else if (current_page.completable_sections.scored[i].completed === false) {
                    all_complete = all_scored = false;
                }
            }
            var response = {};
            if (answers.length)
                response.answers = answers;
                response.questions = questions;

            //When there are multiple answers being submitted at the same time, don't mark the page as complete after each one,
            //only the last one will have dont_send_complete as false.
            if(result) {
                if(result.dont_send_complete) {
                    //now we have checked dont_send_complete, remove it so it's not sent to back end.
                    result.dont_send_complete = undefined;
                    e.stopPropagation();
                    return;
                }
                result.dont_send_complete = undefined;
            }

            if(current_page.completed_by === 'viewed') {

                $page_wrapper.trigger('page_complete', response);

            } else if (current_page.completed_by == 'viewed-all' && all_complete) {

                $page_wrapper.trigger('page_complete', response);

            } else if ((current_page.completed_by == 'any-score' || current_page.completed_by == 'correct-score') && all_scored) {
                //var answers = [];
                var has_outcome = false;
                var all_correct = true;
                var all_incorrect = true;
                var scores = [];
                // now we need to go through, and aggregate results from multiple
                for (var i=0;i<answers.length;i++) {
                    if (answers[i].outcome && answers[i].outcome !== "neutral") {
                        has_outcome = true;
                        if (answers[i].outcome != 'correct')
                            all_correct = false;
                        if (answers[i].outcome != 'wrong')
                            all_incorrect = false;
                        
                    } else if (isNumber(answers[i].score)) {
                        scores.push(answers[i].score);
                    }
                    // answers.push(current_page.completable_sections.scored[i].result);
                }
                if (has_outcome) {
                    // overall completion
                    response.outcome = 'partially-correct';
                    if (all_correct)
                        response.outcome = 'correct';
                    else if (all_incorrect)
                        response.outcome = 'wrong';

                } else if (scores.length) {
                    // if there are scores - 
                    response.score = scores.average();

                }

                // now send completion
                $page_wrapper.trigger('page_complete', response);
            }

            e.stopPropagation();

        });

    }, 5);

};

// now open up a pre-loaded page
Elucidat.prototype._open_page = function ( page_object ) {
    // Close tooltips when a new page is opened. See PD-2597.
    hideAllTooltips();

    // do not allow two overlapping calls to load pages - the sequence all breaks
    if (this.navigating == 'opening')
        return false;
    this.navigating = 'opening';

    // if navigation is not in place, pause until it is
    var context = this;

    // tell the app everything is going swimmingly
    if (typeof this.options.loader == "object")
        if (this.options.loader.success)
            this.options.loader.success();


    var configCookiePolicy = {
        name: 'elucidat-cookie-policy',
        days: 365
    };

    var configCookieAnalytics = {
        name: 'elucidat-analytics',
        days: 365
    };

    // Check to see if the cookie policy should be shown.
    var showCookiePolicy = context._get_cookie(configCookiePolicy.name);
    // Check to see whether Google Analytics data should be tracked.
    var useGoogleAnalytics = context._get_cookie(configCookieAnalytics.name);
    
    if (useGoogleAnalytics === null) { 
        context._set_cookie(configCookieAnalytics.name, 'false', configCookieAnalytics.days);
    }

    // and log the page load to the LMS
    setTimeout(function () {
        context.options.lms.SetLocation( page_object.page_id );
    },50);
    // the json_id of the page contains several different numbers - the last one is the page id and should be marked as the current page
    context.current_page = page_object.page_id;
    // mark page as visited
    this.pages[page_object.page_id ].visited = true;

    // swap out any dates that are still in the HTML
    this._handle_dates(page_object.page_id);

    var $body = $('body');
    // event handler to say that page is about to change
    $body.trigger('elucidat.page.change', page_object);

    var $pew = $body.find('#pew');

    // create a new dom object
    var $new_element = $('<div />');

    $new_element.html(page_object.html);

    // clear out any templates that have made it this far
    $new_element.find('.add-option-template').remove();

    // pages can contain all sorts of elements that can 'complete' a page
    // they all need to be 'completed' for the page to be complete
    var $paw = $new_element.find('#paw');


    // initialise the completable_sections object if it's not been done yet.
    if(page_object.completable_sections === null) {
        page_object.completable_sections = {scored: [], viewed: []};
    }

    //If we haven't yet registered any scored completable sections, set up a listener. If we've already got data in this
    //array then we don't re-create it so that scored sections are maintained across page navigation within the course.
    if(!page_object.completable_sections.scored.length) {
        $paw.off('scorable_section').on('scorable_section', function (e) {
            //Each time a scored section is encountered, store a reference to it here.
            page_object.completable_sections.scored.push({target_id: e.target.id, completed: false});
            e.stopPropagation();
        });
    }

    //Unlinke scored sections, viewed section completion is not persistent across page navigation so each time the page is opened, reset this array.
    page_object.completable_sections.viewed = [];
    $paw.off('completable_section').on('completable_section', function(e) {
        //if the page is completed, all the sections in it are marked as completed.
        page_object.completable_sections.viewed.push({target: e.target, completed: page_object.completed});
        e.stopPropagation();
    });
    
    // page progress (needs to run AFTER form setup and completeable sections)
    PageProgress.ScrollListener.clear();
    $paw.find('.e-js-page-progress-bar').page_progress_bar();
    $paw.find('.e-js-page-progress').page_progress_menu();
    
    // and set up questionnaires
    $paw.find('.answer, .question td').questionnaire_answer({previous_answer: page_object.answer});
    $paw.find('.e-blank-to-fill').fill_blank_answer({previous_answer: page_object.answer});
    $paw.find('form.drag_drop').drag_drop_form({previous_answer: page_object.answer});
    $paw.find('form.sortable').sortable_form({previous_answer: page_object.answer});
    $paw.find('form.swipe_away').swipe_away_form({previous_answer: page_object.answer});
    
    $paw.find('.ft--reportable .learner_input--textarea').free_text_answer({previous_answer: page_object.answer});
    $paw.find('div.e-slider').input_slider();
    $paw.find('form.likert,form.poll').likert_form();
    //$paw.find('form.poll').polling_form();
    $paw.find('form.questionnaire_multiple_response,form.multiple_response').multiple_response();
    $paw.find('form.fill_blanks').fill_blanks();
    $paw.find('form.questionnaire').questionnaire_form();
    $paw.find('.score_summary').score_summary();
    $paw.find('form.form--ft.ft--reportable').free_text_input();
    
    // card stack
    $paw.find('.e-card-stack').card_stack();
    
    
    // video is handled below too

    var $learnerInput = $new_element.find('input.learner_input,textarea.learner_input');

    $learnerInput.learner_input( this.options.inputs ).on('elucidat.learner.input', function (e, input_name, input_value) {
        // Don't send comments for reportable free text input
        if ( !$(this).closest('.form--ft').hasClass('ft--reportable') ) {
            // send to the LRS - only once every 2 seconds -
            clearTimeout(this.commenting_in_progress);
            this.commenting_in_progress = setTimeout(function () {
                context.lrs.queue ({
                    'url': context.lrs.activity_id,
                    'verb': 'commented',
                    //'name': 'Name of the course',
                    'page_url': input_name,
                    'answer': input_value
                });
            },2000);
        }
    });
    $new_element.find('.learner_input').learner_output(this.pages);
    // ensure that each carousel has a selected item
    $new_element.find('[data-slide], [data-slide-to]').fix_carousel_slides( $new_element );
    // insert learner name if applicable
    // LRS only has a learner name in very specific mode - so that is trusted over the LMS (which is always present)
    var $learner_names = $new_element.find('span.learner_name');
    if ($learner_names.length) {
        if (this.lrs && this.lrs.learner_name !== null)
            $learner_names.text(this.lrs.learner_name);
        else if (this.options.lms && context.options.lms.GetLearnerName) {
            setTimeout(function () {
                if (context.options.lms.learner_name === undefined)
                    context.options.lms.learner_name = context.options.lms.GetLearnerName();
                //context.options.lms.learner_name = context.options.lms.GetLearnerName();
                $learner_names.text(context.options.lms.learner_name);
            },1);
        }
    }

    // now access fixes
    // hotspots and other items must have link titles (which cannot be set through the GUI) // not in IE7 though
    //console.log('@todo FIX TITLES restore')
    if (!$('html').hasClass('ie7'))
        $new_element.find( '[data-toggle],[data-slide]' ).fix_titles( $new_element );
        
    // and bring in new page
    // this is if there is no page loaded already
    if (!$pew.length) {
        // console.log(context.pages);
        // first run - add the html into the body
        $new_element.hide();
        $body.prepend( $new_element );
        
        // mark element containing paw
        $paw.contains_paw();

        // now initialise the navigation
        this._init_navigation( $new_element );

        // aria live
        $pew = $body.find('#pew').attr('aria-live','polite');

        // set up swipe events
        $pew.gestures();

        // event handler to say that page is about to change
        $body.trigger('elucidat.page.open', [ page_object, $new_element ]);
        window.top.postMessage('elucidat.page.open', '*');

        // we need to get the animation settings off the body (if there are any)
        // it will be stored in $new_element.find('#__body__moved') - see backend docs to understand why
        var $anim_source = $new_element.find('#__body__moved');
        // update body classes
        $body.body_class({
            class_src: $anim_source
        });
        
        // and set up the page animation
        if ($anim_source.length && $anim_source.attr('data-animation')) {
            var anim_attrs = $anim_source.attr('data-animation').split('|');
            if (anim_attrs[0] && anim_attrs[0] != '-') this['animation']['in']['style'] = anim_attrs[0];
            if (anim_attrs[1]) this['animation']['in']['speed'] = anim_attrs[1] + 's';
            if (anim_attrs[3] && anim_attrs[3] != '-') this['animation']['out']['style'] = anim_attrs[3];
            if (anim_attrs[4]) this['animation']['out']['speed'] = anim_attrs[4] + 's';
        }

        // Wait for animation to start displaying page so elements have height.
        setTimeout(function() {
            $pew.calc_fixed_header_size(true);
        },50);

        // A strange quirk of _manage_progress is that it must be run twice to work (it's a big loop and the first time
        // through it sets some variables which it later relies on... so we ensure it's run here if it's never been run before).
        if(!context.options.has_manage_progress_run) {
            context._manage_progress();
        }

        // bring in the content, with enough time for the page to have been loaded
        setTimeout(function () {
            $new_element.hide().fadeIn(500);

            var $paw = $new_element.find('div#paw');
            context._animate_in( $paw.parent().hide(), function () {
                $body.accessibility_fixes();
                $body.trigger('elucidat.page.ready', [ page_object, $new_element ]);
                window.top.postMessage('elucidat.page.ready', '*');
            });

            $pew.calc_fixed_header_size(true);

            // and videos
            $new_element.find('div.video_player').video();
            $new_element.find('div.audio_player').audio();

            // and completions
            $paw.find('div.carousel').carousel_complete();
            $paw.find('div.modal').modal_complete();
            $paw.find('div.collapse, [data-toggle=collapse-next], [data-toggle=collapse]').collapse_complete();
            $paw.find('div.tab-pane').tabs_complete();

            // tooltips
            $new_element.find('a[data-toggle="tooltip"], button[data-toggle="tooltip"]').tooltip_extended();

            // flipcard handler
            $new_element.find('div.eFlipcard__card').flipcard_handler();

            // body height fix
            $pew.find('div.body_height').body_height();

            // timers
            context.timer.register( $new_element.find('.session_time,.page_time,.page_time_remaining,.chapter_time,.chapter_time_remaining') );

            // charts
            $new_element.find('div.chart,span.chart,span.chart_result').charts( context );

            // badges
            context._award_achievement_badges();

            // now focus on the anchor to tell JAWS that the page has changed
            var $load_anchor = $('.load_anchor')[0];

            if(!$load_anchor) {
                $load_anchor = $('<a id="load_anchor" name="load_anchor" tabIndex="-1" title="You are at the top of page" />');
                $pew.prepend($load_anchor);
            }

            if (showCookiePolicy === "false" && $load_anchor) {
                $load_anchor.focus();
            }
            
            // mark as completed if completed_by is viewed or create custom handlers
            context._page_setup_completed_listener(page_object);

            context._manage_progress();
            // take over all links so that they link back into the same function
            context._fix_links( $new_element );
            for (var i=0; i < context.page_order.length; i++) {
                var loopedPage = context.pages[context.page_order[i]];
                context._set_link_visibility(loopedPage);
            }

            ie8bg.updateElems().getElems().ie8poly_bg_size();

            // allow navigation again
            context.navigating = 'ready';

        },500);

    // this is the loader if there is a page loaded already and we need a fade In / Out
    } else {
        // get reference to old page
        var $old_page_wrapper = $('div#paw');
        // now we suspend aria change announcements
        $pew.attr('aria-busy','true');

        // destroy tooltips
        $pew.find('a[data-toggle="tooltip"], button[data-toggle="tooltip"]').tooltip_extended('destroy');

        // otherwise we are going to swap in and out the page content only
        window.top.postMessage('elucidat.review.page.animate.out', '*');

        context._animate_out($old_page_wrapper.parent(), function () {
            // update body classes
            $body.body_class({
                class_src: $new_element.find('#__body__moved')
            });
            
            // find the page content from the new element
            var $this = $(this);

            var $new_page = $new_element.find('div#paw').parent();

            var $placeholder = $('<div />');
            $this.after( $placeholder );

            // destroy any videos
            $pew.find('div.video_player').video_destroy();
            $pew.find('div.audio_player').audio_destroy();
            // remove full screen class from html
            $('html').removeClass('mejs-fullscreen');

            // and any modals that are still on their way out
            $("#pew div:first > div.modal_wrapper > div").modal_destroy();

            // and ditch page
            $this.remove();

            // find any element with data-role="page.something and replace it in the document
            $pew.find('[data-role^="page."]').each(function () {
                var $this = $(this);
                // only switch if nodeName and class match
                var selector = $this.get(0).nodeName;
                if ($this.attr('class')) {
                    var classes = $this.attr('class').split(' ');
                    for (var c = 0; c < classes.length; c++)
                        if (classes[c].substring(0,2) !== 'e-' && classes[c] !== 'visited' && classes[c] !== 'shown' && classes[c] !== 'completed')
                            selector += '.'+classes[c];
                }

                selector += '[data-role="'+$(this).attr('data-role')+'"]';
                //console.log(selector);

                $(this).replaceWith( $new_element.find(selector) );
            });

            // now copy in the new page
            // there must be a better way of doing this
            $placeholder.after( $new_page.hide() );
            $placeholder.remove();

            // turn gestures back on in case they have been killed (by Brightcove for instance)
            $pew.gestures("enable");



            // event handler to say that page is about to change
            $body.trigger('elucidat.page.open', [ page_object, $new_page ]);
            window.top.postMessage('elucidat.page.open', '*');

            // now animate
            context._animate_in( $new_page, function () {
                $body.accessibility_fixes();
                $body.trigger('elucidat.page.ready', [ page_object, $new_page ]);
                window.top.postMessage('elucidat.page.ready', '*');
            });

            $pew.calc_fixed_header_size(true);

            // videos
            $pew.find('div.video_player').attr('aria-busy', 'true');
            $pew.find('div.video_player').video();
            $pew.find('div.audio_player').audio();

            // and completions
            $new_page.find('div.carousel').carousel_complete();
            $new_page.find('div.modal').modal_complete();
            $new_page.find('div.collapse, [data-toggle=collapse-next], [data-toggle=collapse]').collapse_complete();
            $new_page.find('div.tab-pane').tabs_complete();
            
            // tooltips
            $new_page.find('a[data-toggle="tooltip"], button[data-toggle="tooltip"]').tooltip_extended();

            // body height fix
            $pew.find('div.body_height').body_height();

            // timers
            context.timer.register( $pew.find('.session_time,.page_time,.page_time_remaining,.chapter_time,.chapter_time_remaining') );

            // charts
            if (!$('html').hasClass('ie-lt9'))
                $pew.find('div.chart,span.chart,span.chart_result').charts( context );

            // badges
            context._award_achievement_badges();

            // mark as completed if completed_by is viewed or create custom handlers
            context._page_setup_completed_listener( page_object );
            context._manage_progress();

            // take over all links so that they link back into the same function
            context._fix_links( $pew );

            ie8bg.updateElems().getElems().ie8poly_bg_size();


            // allow navigation again
            context.navigating = 'ready';

            // now focus on the anchor to tell JAWS that the page has changed
            $pew.attr('aria-busy', 'false');
            // move focus
            if (showCookiePolicy === "false") {
                $('.load_anchor')[0].focus();
            }
        });
    }

    var $cookieOverlay = $('#cookie-policy-container');
    var $cookieContainer = $('#cookie-policy-overlay');

    // Show cookie policy if it needs to be displayed.
    if ((showCookiePolicy === 'true' || showCookiePolicy === null) &&
        (window.endpoint && window.endpoint.mode !== 'offline')) {
        $cookieContainer.fadeIn(1000);
        $cookieOverlay.fadeIn(1000);
    }

    var $consentToggle =  $('#consent-toggle');
    var $toggleDescription = $('#toggle-description');

    function setAcceptToggleState () {
        if($('html').attr('lang') === 'de') {
            $toggleDescription.text('Akzeptiert');
        } else {
            $toggleDescription.text('Accepted');
        }
        $toggleDescription.addClass('cookie-policy__textGreen');
    }

    function setRejectToggleState () {
        if($('html').attr('lang') === 'de') {
            $toggleDescription.text('Abgelehnt');
        } else {
            $toggleDescription.text('Rejected');
        }
        $toggleDescription.removeClass('cookie-policy__textGreen');
    }

    if (useGoogleAnalytics === 'true') {
        $consentToggle.toggleClass('cookie-policy__active');
        setAcceptToggleState();
    } else {
        setRejectToggleState();
    }

    $('#consent-toggle').on('click', function() {
        var $this = $(this);
        $this.toggleClass('cookie-policy__active');
    
        if ($this.hasClass('cookie-policy__active')) {
            setAcceptToggleState();
        } else {
            setRejectToggleState();
        }
    });

    $('#accept-cookies').on('click', function() {
        context._set_cookie(configCookiePolicy.name, 'false', configCookiePolicy.days);
        context._set_cookie(configCookieAnalytics.name, 'true', configCookieAnalytics.days);
        $cookieContainer.hide();
        $cookieOverlay.hide();
    });

    $('#save-and-close').on('click', function() {
        context._set_cookie(configCookiePolicy.name, 'false', configCookiePolicy.days);

        if ($consentToggle.hasClass('cookie-policy__active')) {
            context._set_cookie(configCookieAnalytics.name, 'true', configCookieAnalytics.days);
        } else {
            context._set_cookie(configCookieAnalytics.name, 'false', configCookieAnalytics.days);
        }

        $cookieContainer.hide();
        $cookieOverlay.hide();
    });

    $('#manage-cookies').on('click', function() {
        var $section1 = $('.cookie-policy__section1');
        var $section2 = $('.cookie-policy__section2');
        $section1.hide();
        $section2.show();
        $('#consent-toggle').focus();
    });
};
// load a url
Elucidat.prototype._get_progress = function () {
    var num_completed = 0,num_pages = 0;
    for ( var i in this.pages ) {
        if (this.pages[i].completed)
            num_completed++;
        num_pages++;
    }
    return this.progress = 1 / num_pages * num_completed;
};


// load a url
Elucidat.prototype._manage_progress = function () {
    
    var c = this;

    // find out if we are allowed to view a particular page
    // and calculate running scores
    var global_pass = new Elucidat_Milestone ( c.options.global_pass_rate );
    var current = false;
    var last_page_is_completed = false;
    var page_lock_active = false;
    var all_questions_answered = true;
    //Set init to true if this is the first time this function has been called.
    var init = !c.options.has_manage_progress_run;
    c.options.has_manage_progress_run = true;

    //var last_milestone = null;
    // here we will go through the nav, working out if each item is allowed not
    
    // global pass rate needs some extra variables for progress passing
    global_pass.completion_rate = parseInt(c.options.global_completion_rate);
    global_pass.progress_possible = 0;
    var none_scored = true;

    for (var i=0; i<c.page_order.length;i++) {
        var loopedPage = c.pages[ c.page_order[i] ];
        // if a page is hidden, it is disregarded from progress, and scoring
        if (!loopedPage.hidden) {
            
            // we also skip if the parent is hidden
            if ( !loopedPage.parent || !c.pages[ loopedPage.parent ].hidden ) {

                // topic completion 
                // if this page is part of a chapter, we need it here
                var chapter = null;
                // set up a new milestone
                if (loopedPage.is_section) {
                    // console.log( '///\\///\\//\\//' );
                    // console.log( loopedPage.children );
                    // create a milestone for the section
                    chapter = loopedPage.chapter = new Elucidat_Milestone ( c.options.global_pass_rate );
                    chapter.progress_possible = 0;

                } else if (loopedPage.parent && c.pages[ loopedPage.parent ].chapter)
                    chapter = c.pages[ loopedPage.parent ].chapter;


                // reset page lock if we are in a new chapter
                if ( loopedPage.is_section )
                    page_lock_active = false;

                // if page lock is active
                if ( page_lock_active )
                    loopedPage.allowed = false;

                // if page is completed, and !config.allow_completed_pages = NO
                else if ( !c.options.allow_completed_pages && loopedPage.completed)
                    loopedPage.allowed = false;

                // if page is after current one (and current one completed) and !config.allow_future_pages = NO
                else if ( ( i > current && !last_page_is_completed) && !c.options.allow_future_pages)
                    loopedPage.allowed = false;

                // otherwise ok
                else 
                    loopedPage.allowed = true;

                // put page lock on if page has a lock and is not completed
                if ( loopedPage.page_lock && !loopedPage.completed )
                    page_lock_active = true;

                // mark as passed_current
                if ( c.page_order[i] == c.current_page )
                    current = i;

                // record the completion for the next iteration
                if (loopedPage.completed)
                    last_page_is_completed = true;
                else
                    last_page_is_completed = false;

                /* otherwise we also calculate the global score */
                // record that the page is possible
                global_pass.progress_possible++;
                // now chapter
                if (chapter)
                    chapter.progress_possible++;

                // pass fail based on completion
                if (loopedPage.completed) {
                    global_pass.progress++;
                    // now chapter
                    if (chapter)
                        chapter.progress++;
                }
                
                // if this has a score, then mark it too.
                if (isNumber(loopedPage.score)) {
                    none_scored = false;
                    global_pass.addScore( loopedPage.score, 1, loopedPage.weighting );
                    // now chapter
                    if (chapter)
                        chapter.addScore( loopedPage.score, 1, loopedPage.weighting );

                } else if (loopedPage.has_score) {
                    none_scored = false;
                    global_pass.addScore( 0, 1, loopedPage.weighting );
                    // now chapter
                    if (chapter)
                        chapter.addScore( 0, 1, loopedPage.weighting );
                    // mark to show that 
                    all_questions_answered = false;
                }


            }
        }
    }
    
    // is the current page a milestone
    // with an unsubmitted result
    // then send to the LMS!
        // not implemented yet!

    var score_result = global_pass.getScoreResult();
    var score = parseInt(global_pass.getScore());
    var completion_result = global_pass.getProgressResult();
    var progress = parseInt(global_pass.getProgress());

    var ignoreNavigationRules = getShouldIgnoreNavigationRules();

    // finally print out the global scores
    if(!init) {
        console.log('//\n//\n// Overall Result: Progress: '+progress+'%'+(completion_result?' (Completed)':'')+', Score: '+score+'%'+(score_result?' (Passed)':'')+'\n//');
    }

    var currentChapter = null;
    if(c.pages[c.current_page].parent) {
        currentChapter = c.pages[c.pages[c.current_page].parent].chapter;
    } else if(c.pages[c.current_page].chapter) {
        currentChapter = c.pages[c.current_page].chapter;
    }
    if(currentChapter) {
        $('span.total_chapter_score').html( currentChapter.getScore() + '%' );
        $('span.total_chapter_score_raw').html( currentChapter.score );
    }
    // and replace them in the DOM
    $('span.total_score').html( score+'%' );
    $('span.total_score_raw').html( global_pass.score );
    $('span.total_result').html( (score_result?'Pass':'Fail') );

    // and trigger event for external javascript
    $('body').trigger('elucidat.progress', [ progress, global_pass.score, score ]);

    // now we have the final score, we go through the navigation and hide any items that have rules that are not passed
    // this might need delaying so that things aren't slowed down
    // keep a count of how many pages we are, and the position of each item (according to the rules)
    c.total_pages = ignoreNavigationRules ? c.page_order.length : 0;
    // now go through
    for (var p=0; p<c.page_order.length;p++) {
        var loopedPage = c.pages[c.page_order[p]];
        if (ignoreNavigationRules) {
            loopedPage.hidden = false;
            loopedPage.allowed_by_rule = true;
            if(loopedPage.nav_item) {
                loopedPage.nav_item.show();
            }
            loopedPage.position_label = c.total_pages;
        } else if (loopedPage.show_if) {
            if (global_pass.evaluateStatement(loopedPage.show_if, c.pages)) {
                // mark as allowed / not
                loopedPage.allowed_by_rule = true;
                // show item and mark as not hidden
                if (loopedPage.hidden) {
                    // page is just being turned on by the rule, and so should be allowed
                    loopedPage.allowed = true;
                    loopedPage.hidden = false;

                    if (loopedPage.nav_item && loopedPage.nav_item.length)
                        loopedPage.nav_item.show();
                }
                // increment total and position
                c.total_pages++;
                loopedPage.position_label = c.total_pages;

            } else {
                // show item and mark as hidden
                loopedPage.hidden = true;
                loopedPage.allowed_by_rule = false;

                if (loopedPage.nav_item && loopedPage.nav_item.length)
                    loopedPage.nav_item.hide();
            }

        } else {
            loopedPage.allowed_by_rule = true;

            if (!loopedPage.hidden) {
                // increment total and position
                c.total_pages++;
                loopedPage.position_label = c.total_pages;
            }
        }
        
        //console.log('-----------------')
        //console.log(loopedPage.name, loopedPage.page_id)
        //console.log('allowed:'+loopedPage.allowed)
        //console.log('allowed_by_rule:'+loopedPage.allowed_by_rule)

        // lets do a log
        //console.log('Page '+(i+1)+': '+c.page_order[i]+' | completed: '+(c.pages[c.page_order[i]].completed?'yes':'no')+' | score: '+(c.pages[c.page_order[i]].score!==undefined?c.pages[c.page_order[i]].score:'null'));

        // // now manage the navigation and decide if links are enabled or not
        // c._set_link_visibility(loopedPage);
    }

    // now we create custom markers

    // we add classes to the body to show progress, page number and score
    // first remove any that were added before
    var body_classes = [];
    var $body = $('body');
    var existing_classes = ( $body.attr('class') || '' ).split(/\s+/);

    for (var i = 0; i < existing_classes.length; i++) {
        if (
                existing_classes[i].substring(0,6) != 'score-' && 
                existing_classes[i].substring(0,9) != 'progress-' &&
                existing_classes[i].substring(0,5) != 'page-'
            ) {
            //allow through
            body_classes.push ( existing_classes[i] );
        }
    }

    // page number
    body_classes.push ( 'page-'+c.pages[ c.current_page ].position_label );
    // first and last
    if ( c.current_page == c.page_order[0])
        body_classes.push ( 'page-first' );
    else if (c.current_page == c.page_order[c.page_order.length-1] || c.pages[ c.current_page ].send_score)
        body_classes.push ( 'page-last' );
    
    // progress
    body_classes.push ( 'progress-'+progress );
    body_classes.push ( 'progress-lt-'+(Math.ceil(progress/5)*5) );
    body_classes.push ( 'progress-gt-'+(Math.floor(progress/5)*5) );
    // pass / fail
    body_classes.push ( 'score-'+(score_result?'pass':'fail') );
    // score
    body_classes.push ( 'score-eq-'+score );
    if (score) {
        body_classes.push ( 'score-lt-'+(Math.ceil(score/5)*5) );
        body_classes.push ( 'score-gt-'+(Math.floor(score/5)*5) );
    }
    $body.attr('class', body_classes.join(' ') );
    
    // now update navigation based on current status
    // now update navigation based on current status
    // now update navigation based on current status
    c._make_page_active( c.current_page );
    // c._set_link_visibility(c.current_page);
    c._fix_links( $('#pew' ) );
    // now manage the navigation and decide if links are enabled or not
    for (var q=0; q<c.page_order.length;q++) {
        var loopedPage = c.pages[c.page_order[q]];
        c._set_link_visibility(loopedPage);
    }


    // Init is true the first ever time this loops we don't wanna send anything it just has to loop to set up some initial values.
    if(init) {
        return;
    }

    /*
    
    NOW TRACKING - 

    SCORM 1.2 => Have to choose between ‘Completed’ or ‘Passed’

        If ‘Completed’ - 
            
            Send ‘completed’ to LMS as soon as Learner passes N% of pages viewed
            
            If Learner gets to final page and a result hasn’t already been sent, send ‘Incomplete’ or ‘Complete’ depending on whether they have seen N% of pages
            
        If ‘Passed’
            
            Send ‘Passed’ or ‘Failed’ on final page of content depending on whether they have or not
            (Note - questionnaires that have been skipped do not count towards scoring)

    SCORM 2004 => Can be ‘Completed’ and ‘Passed’
        
        Send ‘completed’ to LMS as soon as Learner passes N% of pages viewed
    
        If Learner gets to final page, send ‘Incomplete’ or ‘Complete’ depending on whether they have seen N% of pages
        
        Send ‘Passed’ or ‘Failed’ on final page of content depending on whether they have or not
            (Note - questionnaires that have been skipped do not count towards scoring)
    
    */
    var should_send_score = (current == c.page_order.length-1 || c.pages[ c.current_page ].send_score ? true : false );

    //We are on the last page or the page which the author has chosen as the scoring page.
    //Next time the learner navigates we should re-shuffle question pools.
    c.should_shuffle_pools = c.options.auto_shuffle_pools ? should_send_score : false;


    if (c.options.lms.mode) {


        // IF LAST PAGE, or SEND SCORE, or all_questions_answered
        if (should_send_score || all_questions_answered) {
            // if there are questions
            if (global_pass.score_possible) {
                if (!c.sent_result || ((c.has_retaken_questions || !all_questions_answered) && should_send_score && c.options.allow_retakes)) {
                    // reset retaken questions flag
                    c.has_retaken_questions = false;

                    setTimeout(function () {
                        c.options.lms.SetScore( score, 0, 100 );
                    },50);

                    if (score_result) {
                        if (c.options.completion_action == 'passed' || c.options.lms.mode != '1.2') {
                            setTimeout(function () {
                                c.options.lms.SetPassed();
                            },50);
                        }
                        // if an outcome has been sent to the LMS, send it to Elucidat too
                        
                        c.lrs.queue ({
                            'url': c.lrs.activity_id,
                            'verb': 'passed',
                            'passed': true,
                            'score': score,
                            'duration': c.timer.session_time,
                            'course_name': c.course_name,
                            'progression': progress
                        });

                    } else {
                        if (c.options.completion_action == 'passed' || c.options.lms.mode != '1.2') {
                            setTimeout(function () {
                                c.options.lms.SetFailed();
                            },50);
                        }
                        // if an outcome has been sent to the LMS, send it to Elucidat too
                        c.lrs.queue ({
                            'url': c.lrs.activity_id,
                            'verb': 'failed',
                            'passed': false,
                            'score': score,
                            'duration': c.timer.session_time,
                            'course_name': c.course_name,
                            'progression': progress
                        });

                    }

                    c.sent_result = true;
                }
            }
        }

        // IF COMPLETE
            // IF completion_result OR LAST PAGE OR send_score selected
            // 2004 - Send Completion
            // 1.2 - Send Completion if completion_action = 'completed'
        if ((!c.sent_lrs_completion || c.sent_lms_completion) && (completion_result || should_send_score)) {
            
            if (!c.sent_lms_completion) {
                if (c.options.completion_action == 'completed' || c.options.lms.mode != '1.2') {
                    if (completion_result) {
                        // send to lms
                        setTimeout(function () {
                            c.options.lms.SetCompleted();
                        },50);
                        // only send complete one
                        c.sent_lms_completion = true;
                    } else {
                        // send to lms
                        setTimeout(function () {
                            c.options.lms.SetIncomplete();
                        },50);
                    }
                }
            }

            if (!c.sent_lrs_completion) {
                // if an outcome has been sent to the LMS, send it to Elucidat too
                var completion_statement = {
                    'url': c.lrs.activity_id,
                    'verb': 'completed',
                    //'name': 'Name of the course'
                    'completed': completion_result ? true : false,
                    'progression': progress,
                    'duration': c.timer.session_time,
                    'course_name': c.course_name
                };
                // add passed, if appropriate
                if (global_pass.score_possible && all_questions_answered)
                    completion_statement.passed = score_result ? true : false;
                // now send
                c.lrs.queue (completion_statement);

                // only send complete one
                if (completion_result)
                    c.sent_lrs_completion = true;
            }
        }

        var scorm_set_exit = "logout";
        // if (c.options.lms.mode === "2004" && e.elucidat.options.mode === "offline") {
        //     // offline courses need the suspend data reset when the course is finished... "logout" does not cause a refresh of suspend_data
        //     // so for online courses "logout" should be used as it triggers a new registration.
        //     // for offline 2004 a blank string should be used to force a refresh of the suspend data
        //     // for offline 1.2 a blank string is by default the same as suspend so we should still use logout
        //     scorm_set_exit = "";
        // }
        // 
        if(c.options.enable_success_factors_support) {
            // if we're success factor support then lets not use logout here.
            console.log('SF Support Active');
            scorm_set_exit = "";
        } 

        //IF the course has no scored questions OR the result has been sent) AND completion has been sent.Then tell the LMS that it shouldn't restore (once)
        if(none_scored || c.sent_result && c.sent_lms_completion){
            //Triage - SetExit is not defined in the scorm wrapper in older releases.
            if(typeof c.options.lms.SetExit === 'function') {
                c.options.lms.SetExit(scorm_set_exit);
            }
        } else {
            // else set to suspend because the course hasnt finished and needs to restore from bookmarking
            c.options.lms.SetExit('suspend');
        }

        // finally terminate session
        // send termination if we've completed, and are on the last page
        if (!c.sent_termination && progress == 100 && should_send_score) {
            // send session time (also sent on every page completion)
            if (c.options.lms.SetSessionTime) {
                setTimeout(function () {
                    c.options.lms.SetSessionTime ( c.timer.session_time );
                },50);
            }
            setTimeout(function () {
                console.log('//\n//\n// Session terminated\n//');
                c.lrs.queue ({
                    'url': c.lrs.activity_id,
                    'verb': 'terminated',
                    'duration': c.timer.session_time,
                    'course_name': c.course_name,
                    'progression': progress
                });
            }, 1000);// Reduced this as it was often not sending the terminated singnal on time

            c.sent_termination = true;
        }
        
    }
    return true;
};
Elucidat.prototype._shuffle_question_pools = function (reshuffle) {
    //Shuffle the questions shown from any question pools and show/hide the correct pages.
    this.question_pools._shuffle();
    var pagesToHide = this.question_pools._get_all_pages_to_hide();
    var pagesToShow = this.question_pools._get_all_pages_to_show();

    for (var i = 0; i < pagesToShow.length; i++) {
        this.pages [ pagesToShow[i] ].hidden = false;
    }

    for (var j = 0; j < pagesToHide.length; j++) {
        this.pages [ pagesToHide[j] ].hidden = true;
    }


    //The first time this is called, there is no need to reassess the learner's progress by calling _manage_progress as it will be called later.
    //If it's being called part way through a course it needs to unset any answers and re-assess the progress and rebuild the nav menu.
    if(reshuffle) {

        //remove scores, progress etc  from all the pages in question pools.
        var allQuestionPoolPages = this.question_pools._get_all_pages_in_pools();
        for (var i=0; i<allQuestionPoolPages.length;i++) {
            var loopedPage = this.pages[allQuestionPoolPages[i]];
            loopedPage.answer = null;
            loopedPage.completed = false;
            loopedPage.score = false;
            loopedPage.visited = false;
        }

        // Manage progress to tidy up score/progress.
        this._manage_progress();

        // Init navigation will re-build the nav based on the newly shown/hidden pages.
        this._init_navigation();

        //Bind new links in the nav.
        this._fix_links(this.$nav_container);

        // Set link visibility/styles on all pages - the whole nav has been re-drawn so all the links have been effected.
        for (var i=0; i<this.page_order.length;i++) {
            this._set_link_visibility(this.pages[this.page_order[i]]);
        }

        //Edge case: if the current page is part of a question pool, move to the first valid page in the pool.
        if(this.question_pools._find_page(this.current_page)) {
            var currentPool = this.question_pools._get_pool(this.question_pools._find_page(this.current_page));
            // send user to the first valid page from the pool.
            Elucidat.navigate(currentPool.pagesToShow[0]);


        }
    }


};

// now open up a pre-loaded page
Elucidat.prototype._set_current_page = function ( current_page ) {

    // if navigation is not in place, pause until it is
    var context = this;
    // This is a simple page log - to tell the API that we're on this page

    //JB TODO we should put this back in - it will allow us to restore page views from bookmarking if we store this data and send it back with page history.

    // var xapi_data = {
    //     'url': context.lrs.activity_id,
    //     'verb': 'visited', //this.pages[ current_page ].has_score || this.pages[ current_page ].answer ? 'answered' :
    //     'course_name': context.course_name,
    //     'page_name': context.pages[ current_page ].name,
    //     'page_url': current_page
    // };
    //
    // context.lrs.queue (xapi_data);

    // save history to lms, if in offline mode
    if (this.options.mode == 'offline') {
        setTimeout(function () {
            context._save_history_to_lms();
        }, 100);
    }
};Elucidat.prototype._set_link_visibility = function ( page ) {

    var e = this;

    var ignoreNavigationRules = getShouldIgnoreNavigationRules();

    //Handle navigation links to this page.
    if (page.nav_item && page.nav_item.length) {
        if (page.allowed && page.allowed_by_rule) {
            page.nav_item.removeAttr('disabled').addClass('enabled');

        }
        else {
            page.nav_item.attr('disabled', 'disabled').removeClass('enabled');
        }


        // completed/visited class is the old style one - left in for backwards compatibility
        if (page.completed || ignoreNavigationRules) {
            page.nav_item.addClass('completed').addClass('e-completed');
        }

        if (page.visited || ignoreNavigationRules) {
            page.nav_item.addClass('visited').addClass('e-visited');
        }
    }

    //Handle all links to this page. (page.links_to_page includes navigation links!)
    for (var i = 0; i < page.links_to_page.length; i++) {
        var $link = page.links_to_page[i];

        //Links can optionally be hidden if they link to a page that is hidden by a rule. Otherwise they are just greyed out.
        var shouldBeHidden = $link.attr('data-hidden-by-rule') === 'true' || $link.attr('data-hidden-by-rule') === '1';

        if(!ignoreNavigationRules) {
            //if the page is not allowed, or it's parent is not allowed.
            if((!page.allowed || !page.allowed_by_rule) ||  (page.parent && (!e.pages[page.parent].allowed || !e.pages[page.parent].allowed_by_rule ))) {
                if(shouldBeHidden) {
                    $link
                        .addClass('e-link-hidden-by-rule')
                        .attr({
                            'aria-hidden': 'true',
                            'disabled': 'true'
                        });
                } else {
                    $link.addClass('e-link-disabled-by-rule');
                }
            } else {
                if(shouldBeHidden) {
                    $link
                        .removeClass('e-link-hidden-by-rule')
                        .removeAttr('aria-hidden')
                        .removeAttr('disabled');
                } else {
                    $link.removeClass('e-link-disabled-by-rule');
                }
            }
        }


        // mark on the link if found
        $link.attr('data-page-id', page.page_id);

        if (page.visited || ignoreNavigationRules) {
            $link
                .addClass('visited')
                .addClass('e-visited');
        }

        if(page.chapter) {
            $link.chapter_link(page.chapter);
        } else if (page.completed || ignoreNavigationRules) {
            // completed is legacy, e-completed is the future!
            $link
                .addClass('completed')
                .addClass('e-completed');
        }

        // add markers for chapter and progress
        if (page.is_section) {
            $link
                .addClass('e-is-chapter')
                .addClass('e-chapter-'+page.page_id);
        }
    }
};(function($){
    $.fn.extend({
        form_common: function(options) {

            var defaults = {
                set_interactions: null,
                interactions: null,
                submit_form: null,
                allow_hidden_save_button: false
            };

            options = $.extend(defaults, options);

            return this.each(function() {
                var set_interactions = options.set_interactions;
                var $interactions = options.interactions;
                var submit_form = options.submit_form;

                var $form = $(this);

                // we only want one type of form initialised, per form
                if ($form.data('initialised')) return;
                $form.data('initialised', true);

                // define the interaction
                // if no interaction info is sent
                // or if there is only one of them
                // then set the entire form as the interaction
                if ( $interactions === null ) {
                    $interactions = $form;
                }

                // tell the app it is scorable
                $interactions.trigger('scorable_section').addClass('e-scorable-section');

                // find the form type
                // assessment: no feedback modal
                // survey: neutral feedback modal
                // knowledge check: graded modals
                var form_type;
                var form_types = ['assessment', 'survey', 'knowledge-check'];
                for ( var i = 0; i < form_types.length; i++ ) {
                    var type = form_types[i];
                    if ( $form.hasClass('e-form-'+type) ) {
                        form_type = type;
                    }
                }

                // if form type is survey remove data-status from the answers
                if (form_type === 'survey') {
                    var $answers = $form.find('.answer[data-status]');

                    for (var j = 0; j < $answers.length; j++) {
                        var $answer = $($answers[j]);
                        $answer.removeAttr('data-status');
                    }
                }

                // find the save button
                $form.find('a.save_button, button.save_button').each(function () {
                    var $button = $(this);
                    // make sure there is an appropriate link title
                    if (!$button.attr('title')) {
                        $button.attr('title','Submit form');
                    }
                    // links need an href to appear in the tab order
                    if ($button.is('a') && !$button.attr('href')) {
                        $button.attr('href','#');
                    }

                    // set each interaction
                    var set_form_data = set_interactions( form_type );
                    var form_data = set_form_data.form_data;

                    // by default all forms are scored
                    var is_scored = true;
                    // with the exception of polls and likerts
                    // set_form_data.is_scored is a variable returned only on click input questionnaires
                    // if the form has no correct answers is_score = false
                    if (set_form_data.is_scored === false || form_type === 'survey') {
                        is_scored = false;
                    }

                    // disable the button unless the form has been answered
                    if ( !$form.hasClass('answered') ) {
                        /**
                         * Note - the button--disabled class
                         * is used here rather than the disabled attribute
                         * so that tooltips can still work for the button.
                         * 
                         * The CSS for the class should give sufficient
                         * indication for the user that the button is inactive
                         * or disabled.
                         */
                        $button.addClass('button--disabled');
                        $button.find('i').addClass('ti-lock');
                        $button.attr('aria-disabled', 'true');

                        var $toolTipData = $button.data('tooltip');
                        if ($toolTipData && $toolTipData.text) {
                            $button.attr('aria-label', $toolTipData.text);
                        }

                    }

                    var submitOptions = {
                        form_data: form_data,
                        submit_form: submit_form,
                        form_type: form_type,
                        interactions: $interactions,
                        is_scored: is_scored
                    };

                    $button.click(function(e){
                        e.preventDefault();
                        e.stopPropagation();
                        
                        /**
                         * Don't do anything if the button is disabled (means the form has not been answered)
                         *
                         * Note - the button--disabled class
                         * is used here rather than the disabled attribute
                         * so that tooltips can still work for the button.
                         *
                         * The CSS for the class should give sufficient
                         * indication for the user that the button is inactive
                         * or disabled.
                         */
                        if ($button.hasClass('button--disabled')) {
                            return;
                        }

                        // submit the form
                        $form.submit_form_common(submitOptions);
                    });

                    // if the form does not have a submit button submit the form when an answer is selected
                    if ( options.allow_hidden_save_button && $button.hasClass('e-hidden') ) {
                        $form.find('div.answer').on('selected', function () {
                            // submit the form
                            $form.submit_form_common(submitOptions);
                        });
                    }
                });
            });
        },
        submit_form_common: function(options) {

            var defaults = {
                form_data: null,
                submit_form : null,
                form_type : null,
                interactions: null,
                is_scored: null
            };

            options = $.extend(defaults, options);

            return this.each(function() {
                // options variables
                var form_data = options.form_data;
                var submit_form = options.submit_form;
                var form_type = options.form_type;
                var is_scored = options.is_scored;
                var $interactions = options.interactions;

                var $form = $(this);

                // go through each answer, find out if is_checked or not, and if the answer is correct. assume incorrect
                var form_outcome;
                var all_correct = true;
                var num_correct = 0;

                $interactions.each(function (i) {
                    var $interaction = $(this);
                    // var question_data = $interaction.data('tracking_data');
                    var question_data = jQuery.extend({}, form_data[i]);

                    // run form specific function to get correct answers
                    var submit_return = submit_form($interaction, is_scored);

                    // record selected answers
                    question_data.answer = submit_return.user_answer;
                    question_data.answer_data = submit_return.answer_data;
                    question_data.outcome = "neutral";
                    // record duration
                    var start_time = question_data.duration;
                    question_data.duration = (Date.now() - start_time);

                    // if there is an outcome
                    if ( is_scored ) {
                        // get outcome
                        var interaction_outcome = submit_return.interaction_outcome;

                        if (interaction_outcome === 'correct') {
                            num_correct++;
                        }
                        else if ( interaction_outcome === 'partially-correct') {
                            num_correct++;
                            all_correct = false;
                        }
                        else {
                            all_correct = false
                        }

                        // record outcome
                        question_data.outcome = interaction_outcome;
                    } else if ( $form.hasClass('likert') ) {
                        // if the form is not scored
                        question_data.score = submit_return.score;
                    }

                    // remove styles
                    $interaction.removeClass( 'answered answered-correct answered-partially-correct answered-wrong');
                    // add class according to the outcome
                    $interaction.addClass( is_scored ?  'answered-'+interaction_outcome : 'answered' );

                    // only trigger complete on the last el - otherwise it submits too many times.
                    question_data.dont_send_complete = true;
                    if (i === $interactions.length-1) {
                        question_data.dont_send_complete = false;
                    }
                    //question_data = {data: "THIS IS SOME DATA"};
                    // trigger completion of element
                    $interaction.trigger('answered', question_data );
                });

                // if there are possibly correct answers and form type is not a survey
                if ( is_scored ) {
                    if (all_correct) {
                        form_outcome = 'correct';
                    }
                    else if (!all_correct && num_correct) {
                        form_outcome = 'partially-correct';
                    }
                    else {
                        form_outcome = 'incorrect';
                    }
                }
                else {
                    form_outcome = 'answered';
                }

                // add a styling class
                $form.addClass('e-form-submitted');

                // show the correct modal
                $form.show_form_modal({
                    form_type: form_type,
                    form_outcome: form_outcome,
                    is_scored: is_scored
                });

            });
        },
        show_form_modal: function(options) {

            var defaults = {
                form_type: null,
                form_outcome: null,
                is_scored: null
            };

            options = $.extend(defaults, options);

            return this.each(function() {
                var form_type = options.form_type;
                var form_outcome = options.form_outcome;
                var is_scored = options.is_scored;
                var $partial;
                var $form = $(this);

                // if form type is set use that to decide which popup to show
                // if the form is an 'individual feedback' show the modal that matches the selected answer
                if  ( $form.hasClass('e-form-individual-feedback') && form_type != 'assessment' ) {
                    var $chosen_answer = $form.find('.answer.selected');

                    if ( $chosen_answer.length === 1 && $chosen_answer.attr('data-toggle') === 'modal' ) {
                        var data_target = $chosen_answer.attr('data-target');

                        if (data_target) {
                            var $target_modal = $( data_target );
                            if ($target_modal.length) {
                                $target_modal.modal_show();
                            }
                        }
                    }
                    return false;
                }
                else if ( form_type ) {
                    // if form is an assessment do not display modal
                    if ( form_type === 'assessment' ) {
                        return false;
                    }
                    // if form is a survey display the generic modal
                    else if ( form_type === 'survey' || !is_scored ) {
                        if ($form.find('div.answered').length) {
                            $form.find('div.answered').modal_show();
                        }
                        return false;
                    }
                    // if form is a knowledge check look at form score and display the right modal
                    else if ( form_type === 'knowledge-check' ) {
                        if ( form_outcome === 'correct' ) {
                            $form.find('div.answered_correct').modal_show();
                        }
                        else if ( form_outcome === 'partially-correct' ) {
                            $partial = $form.find('div.answered_partially_correct');
                            // if the partially correct modal does not exist show the incorrect modal
                            $partial.length ? $partial.modal_show() : $form.find('div.answered_incorrect').modal_show();
                        }
                        else if ( form_outcome === 'incorrect' ) {
                            $form.find('div.answered_incorrect').modal_show();
                        }
                        else {
                            $form.find('div.answered_incorrect').modal_show();
                        }
                        return false;
                    }
                }
                // if form type is not set just do the old way
                else {
                    // if there is a generic feedback popup AND there are not correct answers - show generic popup
                    if ( $form.find('div.answered').length ) {
                        if ( $form.hasClass('poll') || !is_scored ) {
                            $form.find('div.answered').modal_show();
                            return false;
                        }
                    }
                    // if the selected answer is correct
                    if ( form_outcome === 'correct' ) {
                        $form.find('div.answered_correct').modal_show();
                    }
                    // if the selected answer is partially correct
                    else if ( form_outcome === 'partially-correct' ) {
                        $partial = $form.find('div.answered_partially_correct');
                        // if the partially correct modal does not exist show the incorrect modal
                        $partial.length ? $partial.modal_show() : $form.find('div.answered_incorrect').modal_show();
                    }
                    // if no correct answer was chosen
                    else if ( form_outcome === 'incorrect' ) {
                        $form.find('div.answered_incorrect').modal_show();
                    }
                    // if none of the above works show the incorrect popup
                    else {
                        $form.find('div.answered_incorrect').modal_show();
                    }
                    return false;
                }
                return false;

            });
        },
        update_form_status: function(options) {
            // used directly in form answer. run when an answer is clicked or text is typed in input

            var defaults = {
                is_answered: false
            };

            options = $.extend(defaults, options);

            return this.each(function() {
                var $form = $(this);
                var $save_button = $form.find('a.save_button, button.save_button');

                // if form is answered
                if ( options.is_answered ) {
                    // add answered
                    $form.addClass('answered');
                    // enable the save button
                    $save_button.removeClass('button--disabled');
                    $save_button.find('i').removeClass('ti-lock');
                    $save_button.attr('aria-disabled', 'false');
                    $save_button.removeAttr('aria-label');
                    $save_button.popover('hide');
                    $save_button.data('showtooltip', 0);
                }
                else {
                    // remove answered
                    $form.removeClass('answered');

                    /**
                     * Disable the save button
                     * 
                     * Note - the button--disabled class
                     * is used here rather than the disabled attribute
                     * so that tooltips can still work for the button.
                     * 
                     * The CSS for the class should give sufficient
                     * indication for the user that the button is inactive
                     * or disabled.
                     */
                    $save_button.addClass('button--disabled');
                    $save_button.find('i').addClass('ti-lock');
                    $save_button.attr('aria-disabled', 'true');

                    var $toolTipData = $save_button.data('tooltip');
                    if ($toolTipData) {
                        $save_button.attr('aria-label', $toolTipData);
                    }
                }

                // remove form status classes added when the form is submitted
                $form.removeClass('e-form-submitted');
                $form.removeClass('answered-correct');
                $form.removeClass('answered-partially-correct');
                $form.removeClass('answered-wrong');
            });
        }
    });
})(jQuery);
(function($){
    $.fn.extend({
        drag_drop_form: function(options) {
            
            var defaults = {
                previous_answer: []
            };
            options = $.extend(defaults, options);


            function centerDropperInBox(options) {
                // this function calculates the distance between a dropper and dropbox
                // and centers the dropper in the dropbox
                // if the dropper is to big to fit in the dropbox it gets scaled down

                var $dropper = options.dropper;
                var $dropbox = options.dropbox;
                if (!$dropper || !$dropbox) {
                    return false;
                }

                $dropper.css( 'transform', 'scale(1)' ); // removes the scaling so that the distance can be calculated properly

                // find center point of drop area
                var dropper_offset = $dropbox.offset();
                dropper_offset.top += $dropbox.height() / 2;
                dropper_offset.left += $dropbox.width() / 2;

                // find center point of dragger
                var dragger_offset = $dropper.offset();
                dragger_offset.top += $dropper.height() / 2;
                dragger_offset.left += $dropper.width() / 2;

                var scale = Math.min($dropbox.width() / $dropper.width(), 1).toFixed(1); // scale down the dropper, rounded to 1 decimal place
                
                $dropper.animate({
                    left: '-=' + (dragger_offset.left - dropper_offset.left) + 'px',
                    top: '-=' + (dragger_offset.top - dropper_offset.top) + 'px'
                }, 200);
                
                $dropper.css( 'transform', 'scale(' + scale + ')');
            }


            return this.each(function() {
                var $form = $(this);
                var chosen_matching = {};

                // returns object with all the form data
                var set_interactions = function() {
                    // set up tincan reports
                    var form_data = {};
                    
                    if (options.previous_answer.length) {
                        // if there are previous answers add class answered to the form
                        // drag and drop form does not restore droppers to previous location
                        $form.addClass('answered')
                    }
                    
                    $form.each(function(i) {
                        form_data[i] = {
                            'duration': Date.now(),
                            'interaction_type': 'matching',
                            'source': [],
                            'target': []
                        }
                        
                        // items should all have ids
                        var correct_matching = [];

                        // main elements
                        var $dropboxes = $form.find(".droppable");
                        var $droppers = $form.find(".draggable");

                        // secondary elements
                        var $dropboxDrawer = $form.find('.dropbox-drawer');
                        var $stack = $form.find('.e-card-stack')

                        // settings based on elements
                        var interactionSettings = {
                            useShortcuts: $form.attr('data-shortcuts') === 'true',
                            useDropboxDrawer: $dropboxDrawer.length,
                            useStackedDroppers: !!$form.attr('data-stack') && $stack.length
                        }
                        
                        if (interactionSettings.useStackedDroppers) {
                            $stack.card_stack({
                                exclude: '.e-dropped'
                            })
                        }

                        $('body').keydown(function (e) {
                            if (e.key === 'Escape') {
                                if ($focusedDropper) {
                                    $focusedDropper
                                        .focus()
                                        .removeClass('ui-draggable-dragging')
                                        .attr('aria-grabbed', false)
                                }
                            }
                        })

                        var $focusedDropper = null;
                        
                        // find draggable items, and then find droppable items
                        $droppers
                        .click(function (e) {
                            $droppers.filter(':not(.e-is-answered):first')[0].focus()
                            return false;
                        })
                        .each(function () {
                            var $dropper = $(this);
                            
                            var id = $dropper.attr('id').replace(/pa_[a-z0-9]+_/i,'');
                            
                            form_data[i].source.push({
                                'id': id,
                                "description": {
                                    "en-US": $dropper.text().trim()
                                }
                            });
                            $dropper.attr('aria-grabbed', false) // indicates that the item can be grabbed

                            // before item is dragged, it is incorrect, unless it doesn't have an href
                            if ( $dropper.attr('href') && $dropper.attr('href').length > 1) {
                                $dropper.data('dataStatus', 'incorrect');
                                $dropper.data('href', $dropper.attr('href'));
                                // now track
                                var target_id = $dropper.attr('href').replace(/pa_[a-z0-9]+_/i,'').replace('#','');
                                correct_matching.push( id+'[.]'+target_id);
                                
                            } else {
                                $dropper.data('dataStatus', 'correct');
                                $dropper.data('href', "");
                            }

                            $dropper.removeAttr('data-status');
                            $dropper.attr('href', '#!');

                            $('body').one('elucidat.page.ready', function () {
                                var $parent_form = $dropper.closest('form');
                                
                                // theses are the options for draggable elements
                                var dragContainer = false;
                                if ($form.attr('data-containment')) {
                                    dragContainer = $form.attr('data-containment') === 'self' ? $form : $form.find($form.attr('data-containment'))
                                }
                                
                                var draggable_options = {
                                    appendTo: interactionSettings.useDropboxDrawer ? $dropboxDrawer : "parent",
                                    helper: interactionSettings.useDropboxDrawer ? function() {
                                        var clone = $(this).clone()
                                        clone.data($(this).data())
                                        clone.css({
                                            width: $(this).width(),
                                            height: $(this).height()
                                        });
                                        return clone
                                    } : "original",
                                    scrollSpeed: 5,
                                    scrollSensitivity: 150,
                                    revert: $form.hasClass('drag_revert') ? "invalid" : false, // reverts the item back to previous position if dropped outside of dropbox
                                    containment: interactionSettings.useDropboxDrawer ? $dropboxDrawer : dragContainer, // prevents item from being dragged outside of the container element
                                    scope: $form.attr('id'),
                                    start: function( event, ui ) {

                                        if (interactionSettings.useStackedDroppers) {
                                            // stop drag if not the first card on the stack
                                            if ( $(this)[0] !== $droppers.filter(':not(.e-dropped):first')[0] ) {
                                                // console.log('only first item can be dragged')
                                                return false;
                                            }
                                        }
                                        
                                        // remove dragged marker
                                        ui.helper
                                            .data('dataStatus', null)
                                            .attr('aria-grabbed', true)

                                        $parent_form.addClass('e-is-dragging')
                                        
                                        if (interactionSettings.useDropboxDrawer) {
                                            $dropboxDrawer.trigger('droparea_reveal', [ui.helper]);
                                        }
                                        
                                    },
                                    stop: function (event, ui) {
                                        var $dropper = ui.helper;
                                        $dropper.attr('aria-grabbed', false)
                                        
                                        if (!$dropper.data('dataStatus')) {
                                            // make sure item has a data-status
                                            $dropper.data('dataStatus', $dropper.data('href').length === 0 ? 'correct' : 'incorrect');
                                        }
                                        $parent_form.removeClass('e-is-dragging')
                                        
                                        if (interactionSettings.useDropboxDrawer) {
                                            setTimeout(function () {
                                                $dropboxDrawer.trigger('droparea_hide', [$dropper]);
                                            }, 500);
                                        }
                                    }
                                };
                                
                                $dropper.draggable(draggable_options);
                            });
                        });

                        // store correct if there are any and form type is not survey
                        if ( correct_matching.length ) {
                            // console.log('correct_matching', correct_matching)
                            form_data[i].correct_responses_pattern = [
                                correct_matching.join("[,]")
                            ];
                        }
                        
                        $dropboxes.each(function() {
                            // store reference
                            var $dropbox = $(this);
                            var id = $dropbox.attr('id').replace(/pa_[a-z0-9]+_/i,'');
                            form_data[i].target.push({
                                'id': id,
                                "description": {
                                    "en-US": $dropbox.text().trim()
                                }
                            });
                            $dropbox.attr('aria-label', $(this).find('.text').text());
                            
                        }).droppable({
                            accept: ".draggable",
                            activeClass: "ui-state-hover",
                            hoverClass: "ui-state-active",
                            scope: $form.attr('id'),
                            drop: function( event, ui ) {
                                
                                var $dropbox = $(this);
                                var $dropper = ui.draggable;

                                var target_id = $dropbox.attr('id').replace(/pa_[a-z0-9]+_/i,'');
                                var source_id = $dropper.attr('id').replace(/pa_[a-z0-9]+_/i,'');
                                // store for report
                                chosen_matching[source_id] = target_id;
                                
                                // see if dropped item matches where it was dropped.
                                var target = $dropper.data('href');
                                if ( target && $dropbox.attr('id') === target.replace('#','')) {
                                    $dropper.data('dataStatus','correct');
                                } else {
                                    $dropper.data('dataStatus','incorrect');
                                } 
                                
                                // mark this item as dragged
                                $dropper
                                    .addClass('e-dropped')
                                    .attr('aria-grabbed', false);

                                $dropbox.addClass('ui-state-feedback');

                                setTimeout(function () {
                                    $dropbox.removeClass('ui-state-feedback')
                                }, 500);


                                // if snap - snap the draggable to the center of the drop area
                                if ($form.hasClass('drag_snap')) {
                                    centerDropperInBox({ dropper: $dropper, dropbox: $dropbox })
                                }
                                
                                // add answered once one has been dragged
                                $form
                                    .update_form_status({
                                        is_answered: true
                                    })
                                    .update_dg_form()
                                
                            }
                        });

                        // setup undo
                        var $undo_button = $form.find('[data-swipe="undo"]')
                        if ($undo_button.length) {

                            $undo_button.attr('disabled', !options.previous_answer.length)

                            $undo_button.click(function () {
                                var $lastAnswer = $($droppers.filter('.e-dropped').get(-1))

                                $lastAnswer
                                    .removeClass('e-dropped')
                                    .data('dataStatus', null)
                                    .removeClass('ui-draggable-dragging')
                                    .attr('aria-grabbed', false)

                                $stack.card_stack({
                                    exclude: '.e-dropped'
                                })
                                setTimeout(function() {
                                    $lastAnswer.focus()
                                }, 500);
                            })

                            if (interactionSettings.useShortcuts) {
                                $form.keydown(function (e) {
                                    if (e.metaKey === true && e.keyCode === 90) {
                                        $undo_button.click()
                                    }

                                })
                            }
                        }
                        

                        // setup drawer
                        if (interactionSettings.useDropboxDrawer) {
                            
                            $dropboxDrawer
                                .on('droparea_reveal', function(e, dropper) {

                                    $(this)
                                        .addClass('e-is-visible')
                                        .removeClass('e-is-hidden')
                                        .css('z-index', 101)
                                        $(this).parents('body').addClass('e-modal-open')
                                        $(this).parents().css('z-index', 'auto')
                                })
                                .on('droparea_hide', function(e, dropper) {
                                    $(this)
                                        .addClass('e-is-hidden')
                                        .removeClass('e-is-visible' )
                                        .parents('body').removeClass('e-modal-open')
                                    
                                    setTimeout(function () {
                                        dropper
                                            .css('z-index', '')
                                            .parents().css('z-index', '')
                                        
                                        $stack.card_stack({
                                            exclude: '.e-dropped'
                                        })
                                        //Once there are no more droppers focus will move to the submit button
                                        $droppers.not('.e-dropped')[0] !== undefined ? $droppers.not('.e-dropped')[0].focus() : $form.find('.save_button').focus();
                                    }, 300);
                                    
                                    
                                })
                                .keydown(function (e) {
                                    if (e.key === 'Escape') {
                                        $dropboxDrawer.trigger('droparea_hide', [$(this)]);
                                    }
                                })
                            
                            $dropboxDrawer
                                .find('.dropbox-drawer-backdrop')
                                .click(function () {
                                    $dropboxDrawer.trigger('droparea_hide', [$(this)]);

                                    $focusedDropper
                                        .focus()
                                        .removeClass('ui-draggable-dragging')
                                        .attr('aria-grabbed', false)
                                        .css({
                                            top: initialPosition.top,
                                            left: initialPosition.left
                                        })

                                })
                            
                        }


                        // shortcuts
                        if (interactionSettings.useShortcuts) {
                            $droppers.keydown(function (e) {
                                if (
                                    e.keyCode === 32 // spacebar
                                    || e.keyCode === 13 // enter
                                    // || (e.ctrlKey === true && e.shiftKey === true && e.keyCode === 77) // ctrl + shift + m
                                ) {
                                    var $dropper = $(e.target);
                                    //If we are using keyboard navigation, disable dragging (otherwise there is potential for there to be two droppers on the page as when we drag we clone the dropper).
                                    $dropper.draggable("disable");
                                    //Make it less tempting to try and drag
                                    $dropper.css('cursor', 'not-allowed')
                                    $focusedDropper = $dropper;
                                    var initialPosition = {
                                        top: $focusedDropper.css('top'),
                                        left: $focusedDropper.css('left')
                                    }

                                    $focusedDropper
                                        .addClass('ui-draggable-dragging')
                                        .attr('aria-grabbed', true)
                                    

                                    $dropboxes.attr('tabindex', '0');

                                    if ($dropboxDrawer.length) {
                                        $dropboxDrawer.trigger('droparea_reveal', [$focusedDropper]);
                                    }

                                    $focusedDropper
                                        .keydown(function (e) {
                                            if ($focusedDropper) {
                                                if (e.key === 'Escape') {
                                                    $dropboxDrawer.trigger('droparea_hide', [$focusedDropper]);
                                                    
                                                    $focusedDropper
                                                        .focus()
                                                        .removeClass('ui-draggable-dragging')
                                                        .attr('aria-grabbed', false)
                                                        .css({
                                                            top: initialPosition.top,
                                                            left: initialPosition.left
                                                        })
                                                    $focusedDropper = null;

                                                    $dropboxes
                                                        .attr('tabindex', '')
                                                        .off();
                                                    
                                                }
                                                else if (
                                                    (e.shiftKey === false && e.key === 'Tab') ||
                                                    e.key === 'ArrowRight' ||
                                                    e.key === 'ArrowDown'
                                                ) {
                                                    $dropboxes[0].focus()
                                                    return false
                                                }
                                                else if (
                                                    (e.shiftKey === true && e.key === 'Tab') ||
                                                    e.key === 'ArrowLeft' ||
                                                    e.key === 'ArrowUp'
                                                ) {
                                                    $dropboxes.get(-1).focus()
                                                    return false
                                                }
                                            }
                                        })


                                    $dropboxes
                                        .on('focus', function (e) {
                                            var $dropbox = $(this)
                                            $dropbox.addClass('ui-state-hover ui-state-active')
                                            centerDropperInBox({ dropper: $focusedDropper, dropbox: $dropbox })
                                        })
                                        .on('blur', function (e) {
                                            var $dropbox = $(this)
                                            $dropbox.removeClass('ui-state-hover ui-state-active')
                                        })
                                        .keydown(function (e) {
                                            if (e.key === 'Escape') {
                                                $dropboxDrawer.trigger('droparea_hide', [$focusedDropper]);
                                                
                                                $focusedDropper
                                                    .focus()
                                                    .removeClass('ui-draggable-dragging')
                                                    .attr('aria-grabbed', false)
                                                    .css({
                                                        top: initialPosition.top,
                                                        left: initialPosition.left
                                                    })
                                                
                                                $focusedDropper = null;
                                                
                                                $dropboxes
                                                    .attr('tabindex', '')
                                                    .off();
                                            }
                                            else if (
                                                e.keyCode === 13 // enter
                                                // || e.keyCode === 32 // spacebar
                                                // || (e.ctrlKey === true && e.shiftKey === true && e.keyCode === 77) // ctrl + shift + m
                                            ) {
                                                $dropboxDrawer.trigger('droparea_hide', [$focusedDropper]);

                                                if ($(this).attr('id') === $focusedDropper.data('href').replace('#', '')) {
                                                    $focusedDropper.data('dataStatus', 'correct');
                                                } else {
                                                    $focusedDropper.data('dataStatus', 'incorrect');
                                                }
                                                    
                                                $focusedDropper
                                                    .addClass('e-dropped')
                                                    .removeClass('ui-draggable-dragging')
                                                    .attr('aria-grabbed', false)
                                                
                                                // update the form and cleanup
                                                $form.update_dg_form()

                                                if (interactionSettings.useDropboxDrawer) {
                                                    // $focusedDropper.hide()
                                                    // $focusedDropper.next().focus()
                                                } else {
                                                    $focusedDropper.focus();
                                                }

                                                $focusedDropper = null;

                                                $dropboxes
                                                    .attr('tabindex', '')
                                                    .off();
                                            }
                                            else if (
                                                (e.shiftKey === false && e.key === 'Tab') ||
                                                e.key === 'ArrowRight' ||
                                                e.key === 'ArrowDown'
                                            ) {
                                                if (e.target === $dropboxes.get(-1)) {
                                                    $dropboxes[0].focus()
                                                    return false
                                                }
                                                $(e.target).next().focus()
                                                return false
                                            }
                                            else if (
                                                (e.shiftKey === true && e.key === 'Tab') ||
                                                e.key === 'ArrowLeft' ||
                                                e.key === 'ArrowUp'
                                            ) {
                                                if (e.target === $dropboxes[0]) {
                                                    $dropboxes.get(-1).focus()
                                                    return false
                                                }
                                                $(e.target).prev().focus()
                                                return false
                                            }
                                        })
                                }
                            })
                        }
                        
                    });

                    return {
                        form_data: form_data
                    }
                }
                
                // returns object with outcome and list of chosen answers.
                var submit_form = function( $interaction, is_scored ) {
                    // record the interaction outcome
                    var interaction_outcome;
                    // record selected answers
                    var user_answer = [];
                    // count the correct droppers
                    var correct_droppers = 0;
                    var all_correct = true;
                    var answered_data = [];
                    
                    if ( is_scored ) {
                        
                        var dropper_is_correct;
                        // go through each dropper to find if correct or incorrect
                        $form.find('.draggable:visible').each(function () {
                            var $dropper = $(this);
                            dropper_is_correct = $dropper.data('dataStatus') === 'correct';
                            
                            if ( dropper_is_correct ) {
                                correct_droppers++;
                            }
                            else {
                                all_correct = false;
                            }
                        });
                        
                        // find the form outcome
                        if (all_correct) {
                            interaction_outcome = 'correct';
                        }
                        else if (!all_correct && correct_droppers) {
                            interaction_outcome = 'partially-correct';
                        }
                        else {
                            interaction_outcome = 'wrong';
                        }
                    }
                
                    for (var c in chosen_matching) {
                        var answer_data = {};
                        user_answer.push( c+'[.]'+chosen_matching[c]);
                        answer_data.reference_id = c;
                        answer_data.dropped_in = chosen_matching[c];
                        answered_data.push(answer_data);
                    }
                    
                    return {
                        user_answer: user_answer,
                        answer_data: answered_data,
                        interaction_outcome: interaction_outcome
                    };
                }
                
                $form.form_common({
                    set_interactions : set_interactions,
                    submit_form: submit_form,
                    interactions: $form
                })
            });
        },
        update_dg_form: function (options) {
            var defaults = {
                undo_button: $(this).find('.e-undo_button')
            };
            var options = $.extend(defaults, options);

            return this.each(function () {
                var $form = $(this);
                var $undo_button = options.undo_button;
                
                var $all_answers = $form.find('.dropper');
                var $answered = $all_answers.filter('.e-dropped');
                
                var num_answers = $all_answers.length;
                var num_answered = $answered.length;


                // IF all answered
                if (num_answers == num_answered) {
                }
                // IF some answered
                else if (num_answered > 0) {
                    $form.update_form_status({
                        is_answered: true
                    })
                    $undo_button.attr('disabled', false)
                }
                // IF none answered
                else if (num_answered == 0) {
                    $form.update_form_status({
                        is_answered: false
                    })
                    $undo_button.attr('disabled', true)
                }

            });
        }
    });
})(jQuery);

(function($){
    $.fn.extend({
        
        fill_blank_answer: function(options) {

            //Settings list and the default values
            var defaults = {
                previous_answer: []
            };
            
            var options = $.extend(defaults, options);

            return this.each(function() {

                // ignore if we have a parent that is '.add-option-template'
                if ( !$(this).closest('.add-option-template').length ) {
                    // every 'answer div is taken over'
                    // we ensure every input starts de-selected
                    // then on press of the parent, the input is toggled
                    // on input change, a class is toggled on the parent
                    var $blank = $(this);
                    var answer_id = $blank.attr('id');
                    var $form = $blank.closest('form');
                    
                    // find if it is a clickable questionnaire or text input
                    var input_type;
                    
                    
                    if (options.previous_answer && typeof options.previous_answer === 'object' &&  options.previous_answer.length) {
                        $form.addClass('answered');
                        
                        // loop through the previous answers
                        for (var i = 0; i < options.previous_answer.length; i++ ) {
                            
                            // find the previous answers interaction id
                            var previous_answer_id = options.previous_answer[i].interaction_id;
                            // console.log(previous_answer_id)
                            
                            // if the 'previous answer interaction ID' matches the 'current blank ID'
                            // get the previous answer and update the blank's val()
                            if ( answer_id === previous_answer_id ) {
                                var answer = options.previous_answer[i].answer[0];
                                $blank.val(answer)
                            }
                        }
                    }
                    
                    $blank.update_blank_status();
                    
                    //Added to prevent the page from reloading if the learner presses enter
                    $blank.keydown(function(event){
                            
                        $('.blankToFill').keypress(function(event) { 
                          return event.keyCode !== 13;
                        });       
                      
                    });

                    $blank.on( "paste", function(event){
                        var pastedText = event.originalEvent.clipboardData.getData('Text');
                        // We treat pasting slightly different and pass the text in as it appears that the DOM does not update fast enough for for Jquery's val method to capture it
                        $blank.update_blank_status(null, pastedText);
                        $form.fill_blank_update_form();
                    });
                                    
                    // update when text input
                    $blank.keyup(function(event){
                        
                        $blank.update_blank_status();
                        $form.fill_blank_update_form();       
                      
                    });
                    
                    $form.fill_blank_update_form();
                    
                }
            });
        },
        
        update_blank_status: function(options, pastedText) {
            var defaults = {};
            var options = $.extend(defaults, options);
            var hasPastedText = pastedText && pastedText.length;
            
            return this.each(function() {
                var $blank = $(this);
                
                // check if the 'blank' has any text
                if ( !$.trim($blank.val()).length && !hasPastedText) {
                    $blank.addClass('e-blank-empty');
                    $blank.removeClass('e-blank-filled');
                }
                else {
                    $blank.addClass('e-blank-filled');
                    $blank.removeClass('e-blank-empty');
                }
                $blank.removeClass('answered-correct');
                $blank.removeClass('answered-wrong');
            });
        },
        
        fill_blank_update_form: function(options) {
            var defaults = {};
            var options = $.extend(defaults, options);
            
            return this.each(function() {
                var $form = $(this);
                
                // check if there is at least one answered blank
                var blanks_filled = 0;
                
                var $siblings = $form.find('.e-blank-to-fill')
                
                $siblings.each(function(){
                    var $this = $(this);
                    if ( $this.hasClass('e-blank-filled') ){
                        blanks_filled++;
                    }    
                })
                
                if ( blanks_filled > 0 ){
                    $form.update_form_status({
                        is_answered: true
                    })
                }
                else {
                    $form.update_form_status({
                        is_answered: false
                    })
                }
            });
        }
    });

})(jQuery);
( function($) {
    $.fn.extend({
        fill_blanks: function(options) {
            
            var defaults ={};
            options = $.extend(defaults, options);
            
            return this.each(function() {
                var $form = $(this);
                // find the blanks container
                var $blanks_container = $form.find('.fill_blanks_text');
                // find the blanks
                var $interactions = $blanks_container.find('input.e-blank-to-fill');
                
                // returns object with all the form data
                var set_interactions = function() {
                    // set up tincan reports
                    var form_data = {};
                    
                    $interactions.each(function(i) {
                        var $interaction = $(this);
                        
                        form_data[i] = {
                            'duration': Date.now(),
                            'interaction_type': 'fill-in'
                        };
                        
                        // store correct answer
                        var correct_answer_texts = $interaction.attr('data-correct-pattern').split(',');
                        for(var j=0; j<correct_answer_texts.length; j++) {
                            correct_answer_texts[j] = correct_answer_texts[j].trim().toLowerCase();
                        }
                        form_data[i].correct_responses_pattern = correct_answer_texts;
                    });
                    
                    return {
                        form_data: form_data
                    }
                }
                
                // returns object with outcome and list of chosen answers.
                var submit_form = function ( $interaction, is_scored ) {
                    // record selected answers
                    var user_answer = [];
                    user_answer.push( $interaction.val().trim().toLowerCase() );
                    var answered_data = [];
                    var answer_data = {};
                    answer_data.answer_text = $interaction.val().trim().toLowerCase();
                    answer_data.element_id = $interaction.attr('id');
                    answer_data.correct_responses = [];
                    
                    if ( is_scored ) {
                        // record the interaction outcome
                        var interaction_outcome;
                        
                        //compare to correct answers for blank with this id
                        var correct_answers = $interaction.attr('data-correct-pattern').split(',');
                        
                        // trim the answers
                        for(var j=0; j<correct_answers.length; j++) {
                            correct_answers[j] = correct_answers[j].trim().toLowerCase();
                            answer_data.correct_responses.push(correct_answers[j]);
                        }
                        
                        // find if the user answer is in the list of correct answers
                        var answered_correct = false;
                        for (var c = 0; c<correct_answers.length; c++) {
                            if(user_answer == correct_answers[c]){
                                answered_correct = true;
                            }
                        }
                        
                        // find the interaction outcome
                        if( answered_correct ) {
                            interaction_outcome = 'correct';
                        }
                        else {
                            interaction_outcome = 'wrong';
                        }
                    }
                    
                    answered_data.push(answer_data);
                    
                    return {
                        user_answer: user_answer,
                        answer_data: answered_data,
                        interaction_outcome: interaction_outcome
                    };
                }
                
                $form.form_common({
                    set_interactions : set_interactions,
                    submit_form: submit_form,
                    interactions: $interactions
                })
                
            });
        }
    });
})(jQuery);

(function($){
    $.fn.extend({
        
        free_text_answer: function(options) {

            //Settings list and the default values
            var defaults = {
                previous_answer: []
            };
            
            var options = $.extend(defaults, options);

            return this.each(function(i) {
                // ignore if we have a parent that is '.add-option-template'
                if ( !$(this).closest('.add-option-template').length ) {
                    // every 'answer div is taken over'
                    // we ensure every input starts de-selected
                    // then on press of the parent, the input is toggled
                    // on input change, a class is toggled on the parent
                    var $freeText = $(this);
                    var answer_id = $freeText.attr('id');
                    var $form = $freeText.closest('form');
                    var $fieldSet = $freeText.closest('fieldset');
                    var $charCount = $('<div class="free_text_char_count">' + options.maxlength + '</div>');
                    
                    //we need to ignore the page pa_123456_ part because it needs to be checked against the last bit, actual id
                    var answer_id_check = answer_id.replace(/(pa|pr)_[a-z0-9]+_/i,'');
                    // Add character count
                    $fieldSet.append($charCount);

                    if (options.previous_answer && typeof options.previous_answer === 'object' &&  options.previous_answer.length) {
                        $form.addClass('answered');
                        
                        // loop through the previous answers
                        for (var i = 0; i < options.previous_answer.length; i++ ) {
                            
                            // find the previous answers interaction id
                            var previous_answer_id = options.previous_answer[i].interaction_id;
                            // if the 'previous answer interaction ID' matches the 'current blank ID'
                            // get the previous answer and update the blank's val()
                            if ( answer_id_check === previous_answer_id) {
                                var answer = options.previous_answer[i].answer[0];
                                setTimeout(function() {
                                    $freeText.val(answer);
                                    $form.free_text_update_form();
                                }, 10);
                            }
                        }
                    }
                    
                    // update when text input
                    $freeText.off().on('input selectionchange propertychange', function(event) {
                        $form.free_text_update_form();
                    });
                    
                    // Give the page time to load before we check if the textarea
                    // is empty otherwise the submit button will still be hidden
                    setTimeout(function() {
                        $form.free_text_update_form();
                    },1);
                }
            });
        },
        
        free_text_update_form: function(options) {
            var defaults = {
                is_answered: true,
                maxlength: 3800
            };
            var options = $.extend(defaults, options);
            
            return this.each(function() {
                var $form = $(this);
                var $freeText = $form.find('.learner_input--textarea');
                var is_answered = options.is_answered;
                
                $freeText.each(function() {
                    var $charCount = $(this).next('.free_text_char_count');

                    if ( !$freeText.val().length ) {
                        is_answered = false;
                    }
                    var count = Math.max(0, options.maxlength - $(this).val().length);
                    
                    var lang = (endpoint.localisation && endpoint.localisation.language.ietf) ? endpoint.localisation.language.ietf : 'en-UK';
                    $charCount.text(count.toLocaleString(lang));
                    
                    if ( count === 0 ) {
                        $charCount.addClass('maxed');
                    } else {
                        $charCount.removeClass('maxed');
                    }
                });
                
                $form.update_form_status({
                    is_answered: is_answered
                });                
            });
        }
    });

})(jQuery);
( function($) {
    $.fn.extend({
        free_text_input: function(options) {
            
            var defaults ={};
            options = $.extend(defaults, options);
            
            return this.each(function() {
                var $form = $(this);

                var $interactions = $form.find('.learner_input--textarea');
                
                // returns object with all the form data
                var set_interactions = function() {
                    // set up tincan reports
                    var form_data = {};

                    
                    $interactions.each(function(i) {
                        var $interaction = $(this);
                        
                        form_data[i] = {
                            'duration': Date.now(),
                            'interaction_type': 'long-fill-in'
                        };
                        
                        // store correct answer
                        form_data[i].correct_responses_pattern = "Free Text";
                    });
                    
                    return {
                        form_data: form_data
                    }
                }
                
                // returns object with outcome and list of chosen answers.
                var submit_form = function ( $interaction, is_scored ) {
                    // record selected answers
                    var user_answer = [];
                    var answered_data = [];
                    var answer_data = {};

                    answer_data.answer_text = $interaction.val().trim();
                    answer_data.element_id = $interaction.attr('id');
                    answer_data.correct_responses = [];
                    
                    user_answer.push( $interaction.val().trim() );
                    answered_data.push(answer_data);
                    return {
                        user_answer: user_answer,
                        answer_data: answered_data,
                        interaction_outcome: 'neutral'
                    };
                }
                
                $form.form_common({
                    set_interactions : set_interactions,
                    submit_form: submit_form,
                    interactions: $interactions
                })
                
            });
        }
    });
})(jQuery);
(function($){
    $.fn.extend({
        likert_form: function() {
            
            var defaults = {};

            return this.each(function( ) {
                var $form = $(this);
                var $fieldsets = $form.find('fieldset');
                
                var $interactions = $fieldsets.length > 1 ? $fieldsets : $form;
                
                // returns object with all the form data
                var set_interactions = function() {
                    // set up tincan reports
                    var form_data = {};
                    // variable to tell the main function if there are any correct answers
                    var is_scored = false;
                    
                    $interactions.each(function(i) {
                        var $interaction = $(this);
                        
                        form_data[i] = {
                            'duration': Date.now(),
                            'interaction_type': 'likert',
                            'scale': []
                        };
                        
                        // find the question (if there is a fieldset legend)
                        var $legend = $interaction.find('legend');
                        if ($legend.length) {
                            form_data[i].page_name = $legend.text();
                        }
                        
                        // array to store correct answer
                        var correct_answers = [];
                        // find the correct answer by looping all answers
                        $interaction.find('div.answer').each(function (){
                            var $answer = $(this);
                            var id = $answer.attr('id').replace(/pa_[a-z0-9]+_/i, '');
                            
                            var dataStatus = $answer.attr('data-status') || 'incorrect';
                            $answer
                                .removeAttr('data-status')
                                .data(
                                    // store the dataStatus in the jquery .data() so that it can be removed from the DOM
                                    // if el has data-status use that, otherwise assume incorrect
                                    'dataStatus', dataStatus
                            );
                            
                            form_data[i].scale.push({
                                'id': id,
                                "description": {
                                    "en-US": $answer.text().trim()
                                }
                            });

                            if (dataStatus === 'correct') {
                                // if the answer's data-status is correct add it to the list of correct answers
                                correct_answers.push( id );
                            }
                        });
                        // store correct
                        if ( correct_answers.length ) {
                            is_scored = true;
                            form_data[i].correct_responses_pattern = [
                                correct_answers.join("[,]")
                            ];
                        }
                    });
                    
                    return {
                        form_data: form_data,
                        is_scored: is_scored
                    };
                };
                
                // returns object with outcome and list of chosen answers.
                var submit_form = function( $interaction, is_scored ) {
                    // record selected answers
                    var user_answer = [];
                    // count the correct answers
                    var correct_answers = 0;
                    var all_correct = true;
                    var answered_data = [];
                    
                    // if there is a correct answer - then we'll use the conventional scoring mode - based on correct / partially correct
                    var $answers = $interaction.find('div.answer:visible');
                    
                    // conventional mode
                    if ( is_scored ) {
                        var interaction_outcome;
                        // loop each answer
                        $answers.each(function () {
                            var $answer = $(this);
                            var $answer_input = $answer.find('input');
                            var answer_is_correct;
                            var is_selected;
                            var answer_data = {};
                            
                            if ($answer.length) {
                                if ($answer_input.length) {
                                    // check the answer data-status
                                    answer_is_correct = $answer.data('dataStatus') === 'correct';
                                    
                                    // see if it's checked
                                    is_selected = $answer.hasClass('selected');
                                    
                                    // if checked store for tracking
                                    if ( is_selected ) {
                                        user_answer.push($answer.attr('id').replace(/pa_[a-z0-9]+_/i,''));
                                        answer_data.element_id = $answer.attr("id").replace(/pa_[a-z0-9]+_/i,'');
                                        answer_data.reference_id = $answer.attr("id").replace(/pa_[a-z0-9]+_/i,'');
                                        answered_data.push(answer_data);
                                    }
                                    // now assess
                                    if ( is_selected && answer_is_correct ) {
                                        // if the chosen answer is correct then up the number of correct answers
                                        correct_answers++;
                                    }
                                    else if ( !answer_is_correct && !is_selected ) {
                                        // if the answer is incorrect and is not selected do nothing
                                    }
                                    else {
                                        // if a selected answers is incorrect
                                        // or if one of the unselected answers is correct
                                        // it means not all answers are correct
                                        all_correct = false;
                                    }
                                }
                            }
                        });
                        
                        // find the form outcome
                        if (all_correct) {
                            interaction_outcome = 'correct';
                        }
                        else if (!all_correct && correct_answers) {
                            interaction_outcome = 'partially-correct';
                        }
                        else {
                            interaction_outcome = 'wrong';
                        }
                        
                        return {
                            user_answer: user_answer,
                            answer_data: answered_data,
                            interaction_outcome: interaction_outcome
                        };
                    }
                    else {
                        // otherwise - with scores - each answer is scored by position
                        // each answer is given a score
                        // first is highest (1), last is lowest (0)
                        // others are inbetween
                        var num_answers = $answers.length - 1;
                        var scaling_score = 0;
                        
                        $answers.each(function (i) {
                            var $answer = $(this);
                            var $answer_input = $answer.find('input');
                            
                            if ($answer.length) {
                                if ($answer_input.length) {
                                    // is chosen
                                    if ($answer.hasClass('selected')) {
                                        // if for is a likert - we also track a score
                                        if ($form.hasClass('likert')) {
                                            if ($answer.data('score') !== undefined) {
                                                // if we have a score set from the input slider
                                                scaling_score = parseFloat( $answer.data('score') );
                                            }
                                            else {
                                                // otherwise we'll set one by position
                                                scaling_score = 1 - ( i / num_answers);
                                            }
                                        }
                                        // record id of chosen answer
                                        user_answer.push($answer.attr('id').replace(/pa_[a-z0-9]+_/i,''));
                                    }
                                }
                            }
                        });
                        
                        return {
                            user_answer: user_answer,
                            score: scaling_score
                        };
                    }
                };
                
                $form.form_common({
                    set_interactions : set_interactions,
                    submit_form: submit_form,
                    interactions: $interactions
                });

            });
        }   
    });
})(jQuery);
(function($){
    $.fn.extend({
        multiple_response: function(options) {
            
            var defaults = {};
            options = $.extend(defaults, options);
            
            return this.each(function() {
                var $form = $(this);
                var $interactions = $form.find('tr.question');
                
                
                // returns object with all the form data
                var set_interactions = function() {
                    // set up tincan reports
                    var form_data = {};
                    
                    // get the text in the true / false table cells
                    var $header_tds = $form.find('table:first').find('tr:first').find('td,th');
                    var choices = [];
                    
                    $header_tds.each(function(i) {
                        var text = $(this).text().trim();
                        
                        if (i > 0 && text.length) {
                            choices.push({
                                'id': i,
                                "description": {
                                    "en-US": text
                                }
                            });
                        }
                    });
                    
                    // track data for each interaction
                    for (var i = 0; i < $interactions.length; i++) {
                        var $interaction = $($interactions[i]);
                        
                        form_data[i] = {
                            'duration': Date.now(),
                            'interaction_type': 'choice',
                            'choices': choices,
                            'elucidat_type': 'multiple response'
                        };
                        
                        // find correct answer
                        // if correct answer is not defined then default to '1' (true)
                        // data-status = 1:true 2:false
                        var dataStatus = parseInt($interaction.attr('data-status')) || 1;
                        var correct_answer = dataStatus;
                        $interaction
                            .removeAttr('data-status')
                            .data(
                                // store the dataStatus in the jquery .data() so that it can be removed from the DOM
                                'dataStatus', dataStatus
                            );


                        // save to tracking
                        form_data[i].correct_responses_pattern = [ correct_answer ];
                    }
                    
                    return {
                        form_data: form_data
                    }
                }
                
                // returns object with outcome and list of chosen answers.
                var submit_form = function ( $interaction, is_scored ) {
                    // record selected answers
                    var user_answer = [];
                    var answered_data = [];
                    var correct_answer = 1;

                    if ( is_scored ) {
                        // record the interaction outcome
                        var interaction_outcome;
                        // check the answer data-status
                        correct_answer = $interaction.data('dataStatus');
                    }
                    
                    // loop throught the TR's TDs
                    $interaction.children().each(function(i) {
                        // if this is the right TD
                        var $answer_input = $(this).find('input');
                        var answer_data = {};
                        
                        if ($answer_input.length) {
                            // if the input is checked - we're correct
                            var is_checked = $answer_input.get(0).checked;
                            
                            // if checked store for tracking
                            if ( is_checked ) {
                                // simply stores the number of the column
                                user_answer.push( i );
                                //reference ID is a 
                                answer_data.reference_id = i;
                                answer_data.element_id = $(this).attr("id").replace(/pa_[a-z0-9]+_/i,'');
                                answered_data.push(answer_data);
                            }
                            
                            // find the interaction outcome
                            if ( is_scored && correct_answer == i ) {
                                if ( is_checked ) {
                                    interaction_outcome = 'correct';
                                }
                                else {
                                    interaction_outcome = 'wrong';
                                }
                            }
                        }
                    });
                    
                    
                    return {
                        user_answer: user_answer,
                        answer_data: answered_data,
                        interaction_outcome: interaction_outcome
                    };
                }
                
                $form.form_common({
                    set_interactions: set_interactions,
                    submit_form: submit_form,
                    interactions: $interactions
                })
            });
        }   
    });
})(jQuery);

(function($){
    $.fn.extend({
        
        questionnaire_answer: function(options) {

            //Settings list and the default values
            var defaults = {
                previous_answer: []
            };
            options = $.extend(defaults, options);

            function updateAnswerStatus ($input, $answer) {
                var $form = $answer.closest('form');
                
                // if the input was checked
                if ($input.get(0).checked) {
                    $answer.addClass('selected');

                    // check if single choice (radio) rather than multiple choice (checkbox)
                    if ( $input.attr('type') === 'radio' ) {
                        var $answer_siblings = $answer.siblings().removeClass('selected');

                        //This remains to support legacy courses. Radio buttons used to all have unique
                        //name attributes so we'd deselect all the others manually each time the selection changed.
                        $answer_siblings.each(function () {
                            $(this).find('input').prop('checked', false);
                        });
                    }

                    // tell the form that it has been answered
                    if ( typeof $form.update_form_status === "function" ) {
                        // function update_form_status does not exist in author mode
                        $form.update_form_status({
                            is_answered: true
                        });
                    }

                    // trigger event to inform any sliders
                    $answer.trigger('selected');
                }
                // if the input was unchecked
                else {
                    
                    // trigger event to inform any sliders
                    // if the form is a likert force the check again because
                    // there is always on option selected in likerts
                    if ($form.hasClass('likert')) {
                        // updateAnswerStatus ($input, $answer);
                        return;
                    }
                    
                    $answer.removeClass('selected');
                    $answer.trigger('unselected');

                    // see if there is any selected answer left in the form
                    var $selected_answers = $form.find('.answer.selected');
                    
                    if ( !$selected_answers.length && typeof $form.update_form_status === "function" ) {
                        // function update_form_status does not exist in author mode
                        // if no selected answers are found disable the save button
                        $form.update_form_status({
                            is_answered: false
                        })
                    }
                }
                
                
            }

            return this.each(function() {

                // ignore if we have a parent that is '.add-option-template'
                if ( !$(this).closest('.add-option-template').length ) {
                    // every 'answer div is taken over'
                    // we ensure every input starts de-selected
                    // then on press of the parent, the input is toggled
                    // on input change, a class is toggled on the parent
                    var $answer = $(this);
                    var answer_id;
                    var $form = $answer.closest('form');
                    
                    // find if it is a clickable questionnaire or text input
                    var input_type;

                    var $input_wrapper = $answer.find('span.input');
                    var $blank_to_fill = $answer.hasClass('e-blank-to-fill');
                    
                    // questionnaire types with radio/checkbox type questions
                    if ($input_wrapper.length) {

                        $input_wrapper.form_input();

                        var $input = $input_wrapper.find('input');

                        if ($input.length) {

                            var start_selected = false;
                            // see if should be selected
                            if ($answer.first().prop('tagName') == 'TD') {
                                // question td mode - multiple response - this needs doing still
                                    // the answer will be a number (e.g. 1)
                                    // if this input is in the (e.g. 2nd td for '1' (0,1,2) td - then it would be selected)
                                // my number
                                if (options.previous_answer && options.previous_answer.length) {
                                    
                                    answer_id = $answer.parent().attr('id').replace(/pa_[a-z0-9]+_/i,'');
                                    var n = 0;
                                    var my_number = -1;
                                    $answer.parent().children().each(function () {
                                        if ( $(this).get(0) === $answer.get(0) )
                                            my_number = n;
                                        n++;
                                    });
                                    for (var i = 0; i < options.previous_answer.length; i++ ) {
                                        //console.log(answer_id +' == '+ options.previous_answer[i].answer);
                                        var answerKey = options.previous_answer[i].answer[0];
                                        
                                        if(typeof answerKey === 'string' && answerKey.indexOf('[:]') !== -1) {
                                            answerKey = answerKey.split('[:]')[0];
                                        }

                                        if (answer_id === answerKey) {
                                            start_selected = true;
                                        }

                                        if (answer_id == options.previous_answer[i].interaction_id && answerKey == my_number) {
                                            start_selected = true;
                                        }
                                    }
                                }

                            } else {
                                // normal div mode
                                answer_id = $answer.attr('id').replace(/pa_[a-z0-9]+_/i,'');
                                if (options.previous_answer && typeof options.previous_answer === 'object' &&  options.previous_answer.length) {
                                    
                                    //Loop through multiple parts on a single page
                                    for (var i = 0; i < options.previous_answer.length; i++ ) {

                                        if(typeof options.previous_answer[i].answer === 'object') {
                                            //Handle mulitple answers to a single question (multiple choice)
                                            for(var j=0; j<options.previous_answer[i].answer.length; j++) {
                                                var answerKey = options.previous_answer[i].answer[j];

                                                if(typeof answerKey === 'string' && answerKey.indexOf('[:]') !== -1) {
                                                    answerKey = answerKey.split('[:]')[0];
                                                }

                                                if (answer_id === answerKey) {
                                                    start_selected = true;
                                                }
                                            }
                                        } else {
                                            if(options.previous_answer[i].answer.split('[:]')[0] === answer_id) {
                                                start_selected = true;
                                            }
                                        }

                                    }
                                } else if(typeof options.previous_answer === 'string') {
                                    if(options.previous_answer.split('[:]')[0] === answer_id) {
                                        start_selected = true;
                                    }
                                }
                            }
                            
                            // start unselected // unless in previous answers
                            $input.get(0).checked = start_selected;
                            if (start_selected) {
                                $answer.addClass('selected');
                                $form.addClass('answered');
                            }
                            
                            // add (and remove a class for focus)
                            $answer.focusin(function () {
                                $answer.addClass('has-focus');
                            });
                            $answer.focusout(function () {
                                $answer.removeClass('has-focus');
                            });

                            var timeout_;
                            var block_for_a_second = false;

                            /// input, label, and answer itself have separate actions
                            $input.bind('click', function (event) {
                                event.stopPropagation();
                            }).change(function () {
                                // update answer with right style
                                clearTimeout(timeout_);
                                timeout_ = setTimeout(function() {
                                    updateAnswerStatus($input, $answer);
                                },20);
                            });

                            // now do click on answer div
                            $answer.bind('click',function (event) {
                                // don't do too often
                                if (block_for_a_second)
                                    return false;

                                block_for_a_second = true;
                                setTimeout(function () { block_for_a_second = false; }, 250);

                                // otherwise it was the div
                                if ( $(this).hasClass('selected') )
                                    $input.get(0).checked = false;
                                else
                                    $input.get(0).checked = true;

                                clearTimeout(timeout_);
                                timeout_ = setTimeout(function() {
                                    updateAnswerStatus($input, $answer);
                                },20);

                                // don't pass on click
                                event.preventDefault();
                                event.stopPropagation();

                            });

                        }
                    }
                    // if the form is fill in the blanks
                    else if ( $blank_to_fill ) {
                        // get the answer id
                        answer_id = $answer.attr('id');
                        
                        if (options.previous_answer && typeof options.previous_answer === 'object' &&  options.previous_answer.length) {
                            
                            // loop through the previous answers
                            for (var i = 0; i < options.previous_answer.length; i++ ) {
                                
                                // find the previous answers interaction id
                                var previous_answer_id = options.previous_answer[i].interaction_id;
                                // console.log(previous_answer_id)
                                
                                // if the 'previous answer interaction ID' matches the 'current blank ID'
                                // get the previous answer and update the blank's val()
                                if ( answer_id === previous_answer_id ) {
                                    var answer = options.previous_answer[i].answer[0];
                                    $answer.val(answer)
                                }
                            }
                        }
                    }

                }
            });
        }
    });

})(jQuery);
(function($){
    $.fn.extend({
        questionnaire_form: function() {

            return this.each(function() {
                var $form = $(this);
                var $interactions = $form

                // returns object with all the form data
                var set_interactions = function() {
                    // set up tincan reports
                    var form_data = {};
                    // variable to tell the main function if there are any correct answers
                    var is_scored = false;

                    $interactions.each(function(i) {
                        var $interaction = $(this);

                        form_data[i] = {
                            'duration': Date.now(),
                            'interaction_type': 'choice',
                            'choices': []
                        };

                        // check answers
                        var correct_answers = [];
                        $interaction.find('div.answer').each(function() {
                            var $answer = $(this);
                            var id = $answer.attr('id').replace(/pa_[a-z0-9]+_/i, '');

                            var dataStatus = $answer.attr('data-status') || 'incorrect';
                            $answer
                                .removeAttr('data-status')
                                .data(
                                    // store the dataStatus in the jquery .data() so that it can be removed from the DOM
                                    // if el has data-status use that, otherwise assume incorrect
                                    'dataStatus', dataStatus
                                );

                                
                            form_data[i].choices.push({
                                'id': id,
                                "description": {
                                    "en-US": $answer.text().trim()
                                }
                            });
                            if (dataStatus === 'correct') {
                                // if the answer's data-status is correct add it to the list of correct answers
                                correct_answers.push(id);
                            }

                        });
                        // store correct answers
                        if (correct_answers.length) {
                            is_scored = true;
                            form_data[i].correct_responses_pattern = [
                                correct_answers.join("[,]")
                            ];
                        }
                    });

                    return {
                        form_data: form_data,
                        is_scored: is_scored
                    }
                };

                // returns object with outcome and list of chosen answers.
                var submit_form = function( $interaction, is_scored ) {
                    // record the interaction outcome
                    var interaction_outcome;
                    // record selected answers
                    var chosen_answers = [];
                    // count the correct answers
                    var correct_answers = 0;
                    var all_correct = true;
                    var answered_data = [];

                    // evaluate each answer
                    $interaction.find('div.answer:visible').each(function () {
                        var $answer = $(this);
                        var $answer_input = $answer.find('input');
                        var answer_is_correct;
                        var is_checked;
                        var answer_data= {};

                        if ($answer.length) {
                            if ($answer_input.length) {
                                // check the answer data-status
                                answer_is_correct = $answer.data('dataStatus') === 'correct';

                                // see if it's checked
                                is_checked = $answer_input.get(0).checked;

                                // if checked store for tracking
                                if ( is_checked ) {
                                    chosen_answers.push($answer.attr('id').replace(/pa_[a-z0-9]+_/i,''));
                                    answer_data.element_id = $answer.attr("id").replace(/pa_[a-z0-9]+_/i,'');
                                    answer_data.reference_id = $answer.attr("id").replace(/pa_[a-z0-9]+_/i, '');
                                    if((typeof learner_service_2021_in_use !== 'undefined') && learner_service_2021_in_use) {
                                        answer_data.uuid = $answer.attr('data-uuid-answer');
                                    }
                                    answered_data.push(answer_data);
                                }
                                // now assess
                                if ( is_checked && answer_is_correct ) {
                                    // if the chosen answer is correct then up the number of correct answers
                                    correct_answers++;
                                }
                                else if ( !answer_is_correct && !is_checked ) {
                                    // if the answer is incorrect and is not selected do nothing
                                }
                                else {
                                    // if a selected answers is incorrect
                                    // or if one of the unselected answers is correct
                                    // it means not all answers are correct
                                    all_correct = false;
                                }
                            }
                        }
                    });

                    // find the interaction outcome
                    if ( is_scored ) {
                        if (all_correct) {
                            interaction_outcome = 'correct';
                        }
                        else if (!all_correct && correct_answers) {
                            interaction_outcome = 'partially-correct';
                        }
                        else {
                            interaction_outcome = 'wrong';
                        }
                    }

                    return {
                        user_answer: chosen_answers,
                        answer_data: answered_data,
                        interaction_outcome: interaction_outcome
                    };
                };

                $form.form_common({
                    set_interactions : set_interactions,
                    submit_form: submit_form,
                    allow_hidden_save_button: true,
                    interactions: $interactions
                })
            });
        }
    });
})(jQuery);
(function($){
    $.fn.extend({
        sortable_form: function(options) {
            
            var defaults = {
                previous_answer: []
            };
            options = $.extend(defaults, options);
            
            return this.each(function() {
                var $form = $(this);
                var $interactions = $form;
                // find the sortable container
                var $ol = $form.find('ol:first');
                // items should all have ids
                var correct_order = [];
                
                // returns object with all the form data
                var set_interactions = function() {
                    // set up tincan reports
                    var form_data = {};
                    var choices = [];
                    
                    // loop sortable items
                    $ol.children().each(function (i) {
                        var $sortable_item = $(this);
                        var sortable_item_id = $sortable_item.attr('id').replace(/pa_[a-z0-9]+_/i,'');
                        
                        choices.push({
                            'id': sortable_item_id,
                            "description": {
                                "en-US": $sortable_item.text().trim()
                            }
                        });
                        
                        correct_order.push(sortable_item_id);
                    });
                    
                    // track data for each interaction
                    for (var i = 0; i < $interactions.length; i++) {
                        var $interaction = $($interactions[i]);
                        
                        form_data[i] = {
                            'duration': Date.now(),
                            'interaction_type': 'sequencing',
                            'choices': choices,
                            'correct_responses_pattern': correct_order.join('[,]')
                        };
                    }
                    
                    // if there are previous answers, get the previous order and arrange the items by that same order
                    if (options.previous_answer && typeof options.previous_answer === 'object' &&  options.previous_answer.length) {
                        // if there are previous answers add class answered to the form
                        $form.addClass('answered');
                        
                        // create array with the order of the previous answer
                        var $previous_order = [];
                        // loop the previous answers to populate the previous order array
                        for (var i = 0; i < options.previous_answer.length; i++ ) {
                            if(typeof options.previous_answer[i].answer === 'object') {
                                for(var j=0; j<options.previous_answer[i].answer.length; j++) {
                                    // get the ID
                                    var item_id = options.previous_answer[i].answer[j];
                                    var split_id = item_id.split('[:]');
                                    // find the item whose ID ends with 'item_id'
                                    var $item = $ol.find('[id$="' + split_id[0] + '"]')
                                    // push item to previous order array
                                    $previous_order.push($item)
                                    // detach item (temove from DOM but keep data)
                                    $item.detach();
                                }
                            }
                        }
                        // append items back to the DOM in the previous order
                        for (var j = 0; j < $previous_order.length; j++) {
                            $ol.append($previous_order[j][0])
                        }
                    }
                    // if there are no previous answers randomize the sortable list
                    else {
                        // randomize order of form
                        $ol.randomize();
                    }
                    
                    // turn gestures off as it conflicts
                    $('body').one('elucidat.page.open', function () {
                        $('#pew').gestures("disable");
                        $ol.sortable({
                            change: function( event, ui ) {
                                $form.update_form_status({
                                    is_answered: true
                                })
                            },
                            appendTo: '#pew',
                            containment: '#paw',
                            scroll: false,
                            helper: 'clone'
                        });
                    });
                    
                    return {
                        form_data: form_data
                    }
                }
                
                // returns object with outcome and list of chosen answers.
                var submit_form = function( $interaction, has_outcome ) {
                    // record the interaction outcome
                    var interaction_outcome;
                    // record selected answers
                    var user_answer = [];
                    // count the correct droppers
                    var correct_answers = 0;
                    var all_correct = true;
                    var answered_data = [];
                    
                    // loop sortable items
                    $ol.children().each(function (i) {
                        var answer_data = {};
                        var id = $(this).attr('id').replace(/pa_[a-z0-9]+_/i,'');
                        answer_data.element_id = id;
                        answer_data.reference_id = id;
                        user_answer.push(id);
                        answered_data.push(answer_data);
                        
                        if ( has_outcome ) {
                            var answer_is_correct = ( id == correct_order[i] ? true : false );
                            
                            if ( answer_is_correct ) {
                                correct_answers++;
                            } else {
                                all_correct = false;
                            }
                        }

                    });
                    
                    // find the form outcome
                    if ( has_outcome ) {
                        if (all_correct) {
                            interaction_outcome = 'correct';
                        }
                        else if (!all_correct && correct_answers) {
                            interaction_outcome = 'partially-correct';
                        }
                        else {
                            interaction_outcome = 'wrong';
                        }
                    }
                    
                    return {
                        user_answer: user_answer,
                        answer_data: answered_data,
                        interaction_outcome: interaction_outcome
                    };
                }
                
                $form.form_common({
                    set_interactions : set_interactions,
                    submit_form: submit_form
                })
            });
        }
    });
})(jQuery);
(function($){
    $.fn.extend({
        swipe_away_form: function(options) {
            
            var defaults = {
                previous_answer: []
            };
            options = $.extend(defaults, options);

            return this.each(function() {
                var $form = $(this);
                var $stack = $form.find('.e-card-stack');
                var $interactions = $form.find('.swipe_card');

                // returns object with all the form data
                var set_interactions = function() {
                    // set up tincan reports
                    var form_data = {};

                    var choices = [];
                    
                    var $swipe_buttons = $form.find('.e-swipe_button')
                    var $card_icons = [];
                    
                    // get some info from the form
                    // grab the options text and icon
                    $swipe_buttons.each(function(o) {
                        var $option = $(this)
                        var dir = $option.attr('data-swipe');
                        var text = $option.text().trim();
                        var $icon = $option.find('.ti').addClass('swipe__icon swipe__icon--'+dir);
                        
                        if (text.length) {
                            choices.push({
                                id: dir,
                                description: {
                                    "en-US": text
                                }
                            });
                        }

                        // get the icon to later append to the card
                        if ( $icon.length ) {
                            $card_icons.push($icon);
                        }
                    });
                    
                    // each of the draggable items
                    $interactions.each(function(i) {
                        var $interaction = $(this)
                        
                        for (var ci = 0; ci < $card_icons.length; ci++) {
                            var $icon = $card_icons[ci]
                            $interaction.prepend($icon.clone())
                        }
                        
                        form_data[i] = {
                            'duration': Date.now(),
                            'interaction_type': 'choice',
                            'choices': choices,
                            'elucidat_type': 'swipe away'
                        }
                        
                        $interaction
                        .click(function (e) {
                            e.preventDefault();
                            // find the first non-answered card and focus it
                            var first = $interactions.filter(':not(.e-is-answered):first')[0];

                            if(first) {
                                first.focus();
                            }

                            return false;
                        })
                        
                        var id = $interaction.attr('id').replace(/pa_[a-z0-9]+_/i,'');
                        
                        // find correct answer
                        // if correct answer is not defined then default to '1'
                        // data-status = 0:left 1:right
                        var dataStatus = parseInt($interaction.attr('data-status'));
                        if (isNaN(dataStatus)) {
                            // default to 0
                            dataStatus = 0
                        }
                        var dataDirection = choices[dataStatus].id

                        $interaction
                            .removeAttr('data-status')
                            .data(
                                // store the dataStatus in the jquery .data() so that it can be removed from the DOM
                                'correctAnswer', dataDirection
                            );

                        // save to tracking
                        form_data[i].correct_responses_pattern = [ choices[dataStatus] ];
                            
                        $('body').one('elucidat.page.ready',function() {                            
                            var min_drag = 100;
                            var max_drag = 500;
                            
                            var move_away = false;
                            var $card, card_offset, swipe_direction;
                            
                            // make draggable
                            // theses are the options for draggable elements
                            var draggable_options = {
                                scroll: false,
                                scope: $form.attr('id'),
                                start: function (event, ui) {
                                    $card = $(this);
                                    
                                    // stop drag if not the first card on the stack
                                    if ( $card[0] !== $interactions.filter(':not(.e-is-answered):first')[0] ) {
                                        // console.log('only first item can be dragged')
                                        return false;
                                    }
                                    
                                    min_drag = ui.helper.width() * 0.5;
                                    max_drag = ui.helper.width() * 0.9;
                                },
                                drag: function( event, ui ) {
                                    card_offset = ui.position.left;
                                    
                                    // rotate card
                                    var rotation = card_offset/10
                                    $card.css({
                                        'transform': 'rotate('+rotation+'deg)'
                                    })
                                    
                                    // if dragged less than the minimum distance
                                    if ( card_offset > -min_drag && card_offset < min_drag ) {
                                        swipe_direction = null;
                                        
                                        $card
                                        .removeClass('e-swipping-left')
                                        .removeClass('e-swipping-right')
                                        
                                        move_away = false;
                                    }
                                    // if dragged more than the maximum distance
                                    else if ( card_offset < -max_drag || card_offset > max_drag ) {
                                        move_away = true;
                                        return false
                                    }
                                    // if dragged more than minimum distance but less than maximum
                                    else if ( card_offset < -min_drag || card_offset > min_drag  ) {
                                        if ( card_offset < -min_drag ) {
                                            // console.log('left')
                                            swipe_direction = 'left'
                                            $card
                                            .addClass('e-swipping-left')
                                        }
                                        else if ( card_offset > min_drag ) {
                                            // console.log('right')
                                            swipe_direction = 'right'
                                            $card
                                            .addClass('e-swipping-right')
                                        }
                                        move_away = true;
                                    }
                                },
                                stop: function( event, ui ) {
                                    // revert
                                    $card.removeClass('e-swipping-left e-swipping-right')
                                    
                                    if ( !move_away ) {
                                        $card.css({
                                            left: ui.originalPosition.left,
                                            top: ui.originalPosition.top,
                                            transform: 'translate3d(0,0,0) rotate(0)'
                                        })
                                    }
                                    // throw card away
                                    else if ( move_away ) {
                                        setTimeout(function() {
                                            $card.hide();
                                        }, 500);
                                        $card.answer_swipe_card({
                                            form: $form,
                                            hasMoved: false,
                                            direction: swipe_direction
                                        })
                                    }
                                }
                            }; // end of draggable_options
                            
                            $interaction.draggable(draggable_options);
                            
                            $interaction.bind("keyup", function(event){
                                var dir_key, undo;
                                switch(event.keyCode){
                                    case 37:
                                    dir_key = 'left'
                                    break;
                                    case 39:
                                    dir_key = 'right'
                                    break;
                                    case 38:
                                    undo = true
                                    break;
                                }
                                
                                if ( dir_key ) {
                                    $interaction.answer_swipe_card({
                                        form: $form,
                                        hasMoved: false,
                                        direction: dir_key
                                    })
                                    if ( $interaction.next() && $interaction.next().length ) {
                                        $interaction.next().focus()
                                    }
                                    else {
                                        $form.find('.save_button').focus()
                                    }
                                }
                                else if ( undo ) {
                                    $form.find('[data-swipe="undo"]').trigger('click')
                                    $interaction.prev().focus()
                                }
                                
                                event.preventDefault();
                            });
                        });
                    });
                    
                    return {
                        form_data: form_data
                    }
                }
                
                // set controls
                var answers_given = []
                
                // button controls
                var $stack_controls = $form.find( '.swipe__controls' );
                    var $undo_button = $stack_controls.find( '[data-swipe="undo"]' )
                    var $swipe_left_button = $stack_controls.find( '[data-swipe="left"]' )
                    var $swipe_right_button = $stack_controls.find( '[data-swipe="right"]' )
                
                
                if ( !$form.hasClass('answered') ) {
                    $undo_button.attr('disabled', true)
                }
                
                $undo_button.click(function() {
                    var $this = $(this);
                    var $last_answer = $( $interactions.filter('.e-is-answered').get( -1 ) )
                    
                    $last_answer
                    .removeClass('e-is-answered')
                    .attr('data-swipe', '')
                    .attr('tabindex', '')
                    .show()
                    
                    $stack.card_stack({
                        exclude: '.e-is-answered'
                    })
                    $form.swipe_away_update_form()
                })
                
                $swipe_left_button.click(function() {
                    var $this = $(this);
                    var $first = $stack.find('.swipe_card:not(.e-is-answered):first');
                    
                    $first.answer_swipe_card({
                        form: $form,
                        hasMoved: false,
                        direction: 'left'
                    })
                })
                
                $swipe_right_button.click(function() {
                    var $this = $(this);
                    var $first = $stack.find('.swipe_card:not(.e-is-answered):first');
                    
                    $first.answer_swipe_card({
                        form: $form,
                        hasMoved: false,
                        direction: 'right'
                    })
                })
                
                
                // returns object with outcome and list of chosen answers.
                var submit_form = function( $interaction, is_scored ) {
                    // record selected answers
                    var user_answer = [];
                    var data_swipe = $interaction.attr('data-swipe');
                    var correctAnswer = $interaction.data('correctAnswer');
                    var answered_data = [];
                    
                    if ( data_swipe ) {
                        user_answer.push( data_swipe );
                        answered_data.push({
                            reference_id: data_swipe,
                            element_id: $interaction.attr("id").replace(/pa_[a-z0-9]+_/i,'')
                        });
                    }
                    

                    if ( is_scored ) {
                        // record the interaction outcome
                        var interaction_outcome;

                        var answered_correct = correctAnswer == data_swipe;
                        // find the interaction outcome
                        if( answered_correct ) {
                            interaction_outcome = 'correct';
                        }
                        else {
                            interaction_outcome = 'wrong';
                        }
                    }
                    return {
                        user_answer: user_answer,
                        answer_data: answered_data,
                        interaction_outcome: interaction_outcome
                    };
                }
                
                $form.form_common({
                    set_interactions : set_interactions,
                    submit_form: submit_form,
                    interactions: $interactions
                })
            });
        },
        answer_swipe_card: function(options) {
            
            var defaults = {
                form : $(this).closest('form'),
                hasMoved: false,
                direction: null,
                top: 0,
                left: 0
            };
            
            options = $.extend(defaults, options);
            
            return this.each(function() {
                
                var $form = options.form;
                var hasMoved = options.hasMoved;
                // if direction is left then we need to invert
                
                var top = options.top;
                var left = options.left;
                
                var $card = $(this);
                var $stack = $card.closest('.e-card-stack');
                
                
                var direction = options.direction;
                var direction_multiplier = (direction == 'right') ? 1 : -1;
                
                var data_swipe = direction;
                
                var transform;
                
                if ( !hasMoved ) {
                    // if card has not moved move it twice it's width in chosen direction
                    var width = $card.width();
                    var offset = width * direction_multiplier;
                    var rotation = offset/10;
                    transform = 'translate3d('+offset+'px,0,0px) rotate('+rotation+'deg)';
                }
                
                else {
                    transform = 'translate3d('+ left +'px,'+ top +'px,0px) rotate('+ left/5 +'deg)'
                }
                    
                $card.css({
                    opacity: 0,
                    transform: transform
                })
                .addClass('e-is-answered')
                .attr('data-swipe', data_swipe)
                .attr('tabindex', '-1')
                
                // give some time for the animation to end and then move card
                setTimeout(function() {
                    
                    $card.css({
                        transform: transform
                    })
                    
                    // answers_given.push($card);
                    $stack.card_stack({
                        exclude: '.e-is-answered'
                    })
                    
                }, 400);
                
                $form.swipe_away_update_form()
            });
        },
        swipe_away_update_form: function(options) {
            var defaults = {
                undo_button: $(this).find('.e-undo_button'),
                swipe_controls: $(this).find('.e-swipe_button')
            };
            var options = $.extend(defaults, options);
            
            return this.each(function() {
                
                var $form = $(this);
                var $undo_button = options.undo_button;
                var $swipe_controls = options.swipe_controls;
                
                var $all_answers = $form.find('.swipe_card');
                var $answered = $all_answers.filter('.e-is-answered');
                
                var num_answers = $all_answers.length;
                var num_answered = $answered.length;
                
                
                // IF all answered
                if ( num_answers == num_answered ) {
                    $swipe_controls.each(function() {
                        $(this).attr('disabled', true)
                    })
                }
                // IF some answered
                else if ( num_answered > 0 ) {
                    $form.update_form_status({
                        is_answered: true
                    })
                    $undo_button.attr('disabled', false)
                    $swipe_controls.each(function() {
                        $(this).attr('disabled', false)
                    })
                }
                // IF none answered
                else if ( num_answered == 0 ) {
                    $form.update_form_status({
                        is_answered: false
                    })
                    $undo_button.attr('disabled', true)
                    $swipe_controls.each(function() {
                        $(this).attr('disabled', false)
                    })
                }
                
            });
        }      
    });
})(jQuery);

(function($){
    $.fn.extend({
        flipcard_handler: function() {
            return this.each(function() {

                var $flipcard = $(this);
                var $flipcardButtons = $flipcard.find('button');
                var $flipcardBody = $flipcard.find('.eFlipcard__card-body');
                var $flipcardFrontButton = $flipcard.find('.eFlipcard__control-front');
                var $flipcardBackButton = $flipcard.find('.eFlipcard__control-back');

                // The following has been added so that we can use aria-described on the front back button, it compensates for Elucidat's dynamic ids
                var flipcardTitleText = $flipcard.find('.eFlipcard__front-title').attr('id');
                $flipcardFrontButton.attr("aria-describedby", flipcardTitleText);

                var flipcardTitleBodyText = $flipcard.find('.eFlipcard__back-text').attr('id');
                $flipcardBackButton.attr("aria-describedby", flipcardTitleBodyText);
                
                function setTabIndexForMultipleItems (removingSelector, addingSelector) {
                    removingSelector.attr("tabindex", -1);
                    addingSelector.attr("tabindex", 0);
                }    
                
                setTabIndexForMultipleItems($flipcardBackButton, $flipcardFrontButton)

                $flipcardButtons.on('click', function () {
                    var hasNotYetFlipped = $flipcardBody.hasClass('in');
                    if(hasNotYetFlipped) {
                        setTabIndexForMultipleItems($flipcardBackButton, $flipcardFrontButton)
                        $flipcardFrontButton.focus();
                    } else {
                        setTabIndexForMultipleItems($flipcardFrontButton, $flipcardBackButton)
                        $flipcardBackButton.focus();
                    }
                });
            });
        }
    });
        
})(jQuery);
(function($){
    var audio_id_overall = 0;
    
    var ua = window.navigator.userAgent.toLowerCase(),
        isiPad = (ua.match(/ipad/i) !== null),
        isiPhone = (ua.match(/iphone/i) !== null),
        isAndroid = (ua.match(/android/i) !== null),
        isMobile = isiPhone || isiPad || isAndroid,
        isIE9 = $('html').hasClass('ie9') || $('html').hasClass('ie8');
        //
        
    var getSrcLang = (function($){
        var src_lang_int = 0;
        return function  (label) {
            for (var c in mejs.language.codes)
                if (mejs.language.codes[c] == label)
                    return c;
            src_lang_int++;
            return 'en'+src_lang_int;
        }
    }());
        
    $.fn.extend({
        audio_destroy: function(options) {
            return this.each(function() {
                var $audio_player = $(this);
                if ( $('html').hasClass('ie8') && $audio_player.get(0).player)
                    $audio_player.get(0).player.remove();
                // remove has audio flag
                $audio_player.parent().removeClass('e-has-audio');

            });
        },
        audio: function(input_options) {
            // pause
            if (input_options == 'pause') {
                return this.each(function() {
                    var $audio_player = $(this);
                    if ($audio_player.parent().hasClass('e-has-audio') && $audio_player.data('player'))
                        $audio_player.data('player').pause();
                });
            }

            var options = $.extend({}, $.fn.audio.defaults, input_options);

            // this is a bit of a hack - but if there are non-visible video players, we trigger a resize to make sure their size updates
            var done_resize = false;
            
            return this.each(function() {
                // find the html, which should be json
                var $audio_player = $(this);
                // don't reinitialise
                if (!$audio_player.parent().hasClass('e-has-audio')) {
                    
                    // tell the app that this can be completed
                    $audio_player.trigger('completable_section').addClass('e-completable-section');

                    if (!$audio_player.is(':visible')) {
                        // delay until the video player is visible - then show it
                        var cant_wait_forever = 0;
                        var wait_until_visible = setInterval(function () {
                            if ($audio_player.is(':visible')) {
                                if (!$audio_player.find('.mejs-container').length) {
                                    // if not there already - pass back to itself
                                    $audio_player.audio( input_options );
                                } else {
                                    // otherwise - trigger a resize
                                    if (!done_resize) {             
                                        $(window).trigger('resize','completed');
                                        done_resize = true;
                                    }
                                }
                                clearInterval(wait_until_visible);
                            }

                            cant_wait_forever++;
                            if (cant_wait_forever > 30)
                                clearInterval(wait_until_visible);
                        },100);

                    // if visible already
                    } else {
                        var audio_object;
                        // increment the id
                        audio_id_overall++;
                        var audio_id = audio_id_overall;

                        if ($audio_player.attr('data-media')) {
                            audio_object = $audio_player.attr('data-media').split(':');
                        } else {
                            $audio_player.attr('data-media', $audio_player.text());
                            audio_object = $audio_player.text().split(':');
                        }
                        $audio_player.empty();

                        var track = '';
                        var defaultCaption;

                        // if we have a second parameter, then that is a captioning file
                        if ($audio_player.attr('data-caption')) {
                            var caption_object = JSON.parse($audio_player.attr('data-caption'));

                            if (caption_object && Array.isArray(caption_object.captions)) {
                                track = caption_object.captions.reduce(function (tracks, caption) {
                                    if ($.cookies.has('assets_token')) {
                                      // Antiquated approach, to keep IE happy.
                                      var join_string = (caption.url.indexOf('?') === -1) ? '?' : '&';
                                      caption.url += join_string + 'assets_token=' + $.cookies.get('assets_token');
                                    }

                                    var srcLang = getSrcLang(caption.name);

                                    // see PD-2461
                                    if (caption['default']) {
                                        defaultCaption = srcLang;
                                    }

                                    return tracks + '<track'
                                        + ' kind="subtitles"'
                                        + ' label="' + caption.name + '"'
                                        + ' src="' + caption.url + '"'
                                        + ' srclang="' + srcLang + '"'
                                        + ' />';
                                }, '');
                            }
                        }

                        if (audio_object[0] == 'audio') {
                            var audio_url = (audio_object[1]+(audio_object[2]?':'+audio_object[2]:'')).replace('~[^a-z0-9\.\_\-\:\/]~gi','');

                            if (audio_url) {

                                var audio_id_array = audio_url.split('/');
                                //var audio_id = audio_id_array[audio_id_array.length-1].replace('.mp4','');

                                var base_url = audio_url.substring(0, audio_url.lastIndexOf("."));

                                var html = '<audio class="e-mejs-player" id="audio'+ (audio_id) +'" src="' + audio_url +'" preload="none">'+//'
                                    //'<source src="'+ base_url +'.mp4" type="audio/mp4" />' +
                                    //'<source src="'+ base_url +'.ogg" type="audio/ogg" />' +
                                    //'<source src="'+ base_url +'.mp3" type="audio/mp3" />' +
                                    track +
                                '</audio>';

                                $audio_player.html( html );

                                if (options.allowAutoplay && $audio_player.parent().attr('data-autoplay') == 'yes')
                                    $audio_player.find('audio').attr('autoplay',true);

                                var me_delay = isIE9 ? 1000 : 0;
                                setTimeout(function () {

                                    var assetFilePath = '/static';
                                    if(typeof e !== 'undefined') {
                                        if(e.elucidat.options.mode === 'scorm') {
                                            assetFilePath = 'https://learning.elucidat.com' + assetFilePath;
                                        } else if(e.elucidat.options.mode === 'offline') {
                                            assetFilePath = 'vendor'
                                        }
                                    }
                                    var player = new MediaElementPlayer( '#audio'+audio_id, {
                                        //mode: 'shim',
                                        audioWidth: $audio_player.width(),
                                        flashName: 'flashmediaelement-cdn-2.22.0.swf',
                                        pauseOtherPlayers: false,
                                        autoRewind: false,
                                        loop: $audio_player.parent().attr('data-loop') == 'yes' ? true : false,
                                        //autoplay: (options.allowAutoplay && $audio_player.parent().attr('data-autoplay') == 'yes'? true : false),
                                        pluginPath: assetFilePath + '/mediaelement/',
                                        // set the caption to be set as default (see PD-2461)
                                        startLanguage: defaultCaption,
                                        success: function (mediaElement, domObject) { 
                                            // add event listener
                                            if (mediaElement) {
                                                // add event listener
                                                mediaElement.addEventListener('ended', function(e) {
                                                    // mark completion       
                                                    $audio_player.trigger('audio_complete').trigger('section_complete'); 
                                                }, false);
                                            }
                                        },
                                        enableKeyboard: options.enableKeyboard

                                    });

                                    $audio_player.data('player', player);

                                },me_delay);

                                // add a class to container
                                $audio_player.parent().addClass('e-has-audio');

                            }

                        }

                    }

                }
                
            });
        }   
    });

    //Settings list and the default values
    $.fn.audio.defaults = {
        enableKeyboard: true,
        allowAutoplay: true
    };
        
})(jQuery);
(function($){
    var video_id_overall = 0;

    var ua = window.navigator.userAgent.toLowerCase(),
        isiPad = (ua.match(/ipad/i) !== null),
        isiPhone = (ua.match(/iphone/i) !== null),
        isAndroid = (ua.match(/android/i) !== null),
        isMobile = isiPhone || isiPad || isAndroid,
        isIE9 = $('html').hasClass('ie9') || $('html').hasClass('ie8');
        //
        
    var getSrcLang = (function($){
        var src_lang_int = 0;
        return function  (label) {
            for (var c in mejs.language.codes)
                if (mejs.language.codes[c] == label)
                    return c;
            src_lang_int++;
            return 'en'+src_lang_int;
        }
    }());

    $.fn.extend({
        video_destroy: function(options) {
            return this.each(function() {
                var $video_player = $(this);
                if ($video_player.get(0).player)
                    $video_player.get(0).player.remove();
                // remove has audio flag
                $video_player.parent().removeClass('e-has-video');
            });
        },
        video: function(input_options) {
            // pause
            if (input_options == 'pause') {
                return this.each(function() {
                    var $video_player = $(this);
                    if ($video_player.parent().hasClass('e-has-video') && $video_player.data('player'))
                        $video_player.data('player').pause();
                });
            }

            function endScreenPosition ($end_screen, $video_player) {
                // if there's an end screen - show it now (and size it nicely)
                if ($end_screen.length) {
                    var video_height = $video_player.height();
                    var video_margin = parseInt($video_player.parent().css('margin-top').replace('px',''));
                    // calculate the margin of the parent and remove px for calculations
                    $end_screen.css({
                       'min-height' : video_height,
                       'margin-top' : (0 - video_height - video_margin)
                    });
                }
            }

            // adapt bit rate to the bandwidth
            if (window['bandwidth'] && window.bandwidth > 0) {
                // new style detection for version 3.0 and forward
                // numbers may need tweaking
                if (window.bandwidth < 450)
                    $.fn.video.defaults.videoBitRate = 350;
                else if (window.bandwidth < 800)
                    $.fn.video.defaults.videoBitRate = 700;
                else if (window.bandwidth < 1350)
                    $.fn.video.defaults.videoBitRate = 1200;
            }

            var options = $.extend({}, $.fn.video.defaults, input_options);

            // this is a bit of a hack - but if there are non-visible video players, we trigger a resize to make sure their size updates
            var done_resize = false;

            return this.each(function() {

                // find the html, which should be json
                var $video_player = $(this);
                // don't reinitialise
                if (!$video_player.parent().hasClass('e-has-video')) {

                    // tell the app that this can be completed
                    $video_player.trigger('completable_section').addClass('e-completable-section');
                    // video completion action

                    var w,h, video_url, video_html, do_media_element = true;

                    if (!$video_player.is(':visible')) {

                        // delay until the video player is visible - then show it
                        var cant_wait_forever = 0;
                        var wait_until_visible = setInterval(function () {
                            if ($video_player.is(':visible')) {
                                if (!$video_player.find('.mejs-container').length) {
                                    // if not there already - pass back to itself
                                    $video_player.video( input_options );
                                } else {
                                    // otherwise - trigger a resize
                                    if (!done_resize) {
                                        $(window).trigger('resize', 'completed');
                                        done_resize = true;
                                    }
                                }
                                clearInterval(wait_until_visible);
                            }
                            cant_wait_forever++;
                            if (cant_wait_forever > 30)
                                clearInterval(wait_until_visible);
                        },100);

                    // if visible already
                    } else {

                        // increment the id
                        video_id_overall++;
                        var video_id = video_id_overall;

                        var video_object;

                        if ($video_player.attr('data-media')) {
                            video_object = $video_player.attr('data-media').split(':');
                        } else {
                            $video_player.attr('data-media', $video_player.text());
                            video_object = $video_player.text().split(':');
                        }
                        // add class on complete of video
                        $video_player.on('section_complete', function (e) {
                            // video ended class
                            var $video_wrapper = $video_player.closest('.e-video-wrapper');
                            if (!$video_wrapper.length)
                                $video_wrapper = $video_player.parent();
                            $video_wrapper.addClass('e-video-completed');
                        });

                        // save original contents to data attribute for the app
                        $video_player.empty();

                        var track = '';
                        var defaultCaption;

                        // if we have a second parameter, then that is a captioning file
                        if ($video_player.attr('data-caption')) {
                            var caption_object = JSON.parse($video_player.attr('data-caption'));

                            if (caption_object && Array.isArray(caption_object.captions)) {
                                track = caption_object.captions.reduce(function (tracks, caption) {
                                    if ($.cookies.has('assets_token')) {
                                      // Antiquated approach, to keep IE happy.
                                      var join_string = (caption.url.indexOf('?') === -1) ? '?' : '&';
                                      caption.url += join_string + 'assets_token=' + $.cookies.get('assets_token');
                                    }

                                    var srcLang = getSrcLang(caption.name);

                                    // see PD-2461
                                    if (caption['default']) {
                                        defaultCaption = srcLang;
                                    }

                                    return tracks + '<track'
                                        + ' kind="subtitles"'
                                        + ' label="' + caption.name + '"'
                                        + ' src="' + caption.url + '"'
                                        + ' srclang="' + srcLang + '"'
                                        + ' />';
                                }, '');
                            }
                        }

                        // now adjust the size and position of the end screen
                        var $end_screen = $video_player.parent().siblings('.e-video-ending-screen');

                        // now do stuff with it
                        if (video_object[0] == 'video' || video_object[0] == 'youtube' || video_object[0] == 'external') {

                            if (video_object[0] == 'video' || video_object[0] == 'external') {
                                video_url = (video_object[1]+(video_object[2]?':'+video_object[2]:'')).replace('~[^a-z0-9\.\_\-\:\/]~gi','');

                                if (video_url) {
									var queryString = '';
									//a query string if present and add it back when rendering
									if(video_url.indexOf("?") !== -1) {
										queryString = video_url.slice(video_url.indexOf("?"));
									}

                                    var basename = video_url.replace('.mp4','').replace('.webm','')
										.replace(queryString,'');
                                    var poster ='';

                                    // Check to see if the url contains a learner id and if the LMS is available
                                    if (video_url.match(/({|%7B)+learner\.id(}|%7D)+/ig) && e.elucidat.lms)
                                    {
                                        // Get the learner id from the LMS
                                        var learnerID = e.elucidat.lms.GetLearnerID();

                                        // Check that we have a learner id and that its got a length
                                        if ( learnerID && learnerID.length > 0 )
                                            // If so then replace the learner ID in the url
                                            learnerID = video_url.replace( /({|%7B)+learner\.id(}|%7D)+/ig, learnerID )
                                    }

                                    // add the poster image in if one has been specified
                                    if ($video_player.attr('data-poster'))
                                        // if poster is defined
                                        poster = ' poster="'+$video_player.attr('data-poster')+'"';

                                    // load
                                    if (video_object[0] == 'video') {
                                        var bitrate_detect = video_url.indexOf('.1600.') != -1 ? true : false;
                                        // if no poster by now - add in the fallback
                                        if (poster === '') {
                                            // in 'bitrate' mode - the thumbnail is .thumbnail.jpg
                                            // otherwise it it -video-thumbnail.jpg
                                            poster = basename.replace('.1600','') + (bitrate_detect? '.thumbnail.jpg' : '-video-thumbnail.jpg' );
                                            poster = ' poster="'+poster+'"';
                                        }
                                        // we might have a name ending in a bitrate though - e.g.1600.mp4
                                        // if that is the case we will set the bit rate dynamically
                                        if (bitrate_detect) {
                                            basename = basename.replace('.1600','.'+options.videoBitRate);
                                            console.log('Video bitrate set at '+options.videoBitRate+'kbps');
                                        }

                                    }

                                    var video_style = 'style="width:100%;height:100%;" width="100%" height="100%"';

                                    if (isIE9) {
                                        w = $video_player.width();
                                        h = $video_player.height();
                                        if (h <= 100)
                                            h = Math.round(w / 16 * 9);
                                        video_style = 'width="'+w+'" height="'+h+'"';
                                    }

                                    video_html = '<video controls="controls"'+poster+' class="e-mejs-player" id="video'+video_id+'" '+video_style+'>';
                                    /*
                                        Setting preload to metadata causes Chrome to misload the mp4 file, after 8 videos

                                        But -
                                         preload="none" // metadata

                                    */
                                    //    // +'chrome has a snag about caching webm files, hence the timestamp
                                    var datestamp = '';//(navigator.userAgent.indexOf('Chrome') != -1 ? '?'+Date.now() : '' );

                                    video_html += '<source src="'+ basename +'.mp4'+queryString+datestamp+'" type="video/mp4" />';//'+datestamp+'
                                    video_html += track;
                                    video_html += '</video>';

                                    $video_player.html( video_html );

                                    // add a class to container
                                    $video_player.parent().addClass('e-has-video');
                                }

                            } else if (video_object[0] == 'youtube') {

                                video_url = (video_object[1]+':'+video_object[2]);

                                //https://www.youtube.com/watch?v=5NV6Rdv1a3I
                                //http://youtu.be/5NV6Rdv1a3I
                                //http://www.youtube.com/embed/5NV6Rdv1a3I

                                // change youtub.be URL
                                video_url = video_url.replace('\/youtu.be\/','/www.youtube.com/watch?v=');
                                //video_url = video_url.replace('\/www.youtube.com\/watch?v=','/www.youtube.com/embed/');
                                video_url = video_url.replace('\/www.youtube.com\/embed\/', '/www.youtube.com/watch?v=');
                                // must be https
                                video_url = video_url.replace('http:','https://');//+'?autoplay=1';

                                if (video_url.indexOf('youtube.com') != -1) {

                                    w = $video_player.width();
                                    h = $video_player.height();
                                    if (h <= 100)
                                        h = Math.round(w / 16 * 9);

                                    var video_style = 'style="width:100%;height:100%;" width="'+Math.round(w)+'" height="'+Math.round(h)+'"';
                                    // we need to tidy up the url a bit - so we can get the values
                                    // from the url to use as player variables in the youtubeAPI that
                                    // media element want's to use - otherwise we have something like
                                    // ?rel=0?someothervalue= - which breaks
                                    var base_url = video_url.substring(0, video_url.indexOf('?') + 1);
                                    var queries = video_url.substring(video_url.indexOf('?') + 1);

                                    queries = queries.replace("?", "&");
                                    video_url = base_url + queries;

                                    if (isMobile ) {
                                        
                                        // first parameter must be preceded by '?' and the rest '&' for mobile
                                        var i = 0;
                                        queries = queries.replace(/[\?\&]/g, function(match) { 
                                            return  i++ === 0 ? '?' : '&';
                                        });
                                        
                                        video_url = base_url + queries;

                                        video_url = video_url.replace('\/www.youtube.com\/watch?v=', '/www.youtube.com/embed/');
                                        // problems with media element on mobile
                                        do_media_element = false;
                                        video_style = 'width="'+w+'" height="'+h+'"';

                                        video_html = '<iframe id="video'+ (video_id) +'" src="'+ video_url +'" '+video_style+' frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';

                                    } else {

                                        video_html = '<video class="e-mejs-player" id="video'+ (video_id) +'"'+video_style+'>'+
                                            '<source src="'+ video_url +'" type="video/youtube" />' +
                                            track +
                                        '</video>';

                                    }
                                    $video_player.html( video_html );
                                    $video_player.addClass('youtube');

                                    // add a class to container
                                    $video_player.parent().addClass('e-has-video');
                                }
                            }

                            if (do_media_element) {

                                var me_delay = isIE9 ? 1000 : 0;

                                setTimeout(function () {

                                    var assetFilePath = '/static';
                                    if(typeof e !== 'undefined') {
                                        if(e.elucidat.options.mode === 'scorm') {
                                            assetFilePath = 'https://learning.elucidat.com' + assetFilePath;
                                        } else if(e.elucidat.options.mode === 'offline') {
                                            assetFilePath = 'vendor'
                                        }
                                    }

                                    var videoOptions = {
                                        flashName: 'flashmediaelement-cdn-2.22.0.swf',
                                        pauseOtherPlayers: false,
                                        autoRewind: false,
                                        enableAutosize: true,
                                        flashScriptAccess: 'always',
                                        pluginPath: assetFilePath + '/mediaelement/',
                                        // set the caption to be set as default (see PD-2461)
                                        startLanguage: defaultCaption,
                                        loop: $video_player.parent().attr('data-loop') == 'yes' ? true : false,
                                        // if you change this path, remember to change in controller / release / _make_js() too
                                        success: function (mediaElement, domObject) {
                                            // add event listener
                                            if (mediaElement) {
                                                // completed
                                                mediaElement.addEventListener('ended', function(e) {
                                                    if ($video_player.length) {
                                                        $video_player.trigger('section_complete');

                                                        if ( $video_player.closest('.modal').length ) {
                                                            $video_player.closest('.modal').trigger('section_complete');
                                                        }
                                                    }
                                                }, false);
                                                // fixes to make the video look right
                                                if ($video_player.length)
                                                    $video_player.find('.mejs-poster').css('background-size','cover');

                                                mediaElement.addEventListener('canplay', function(e) {
                                                    if (domObject) {
                                                        var $domObject = $(domObject);
                                                        if ($domObject.length)
                                                            $domObject.height('100.05%');
                                                    }
                                                    // reposition end screen
                                                    endScreenPosition($end_screen, $video_player);

                                                }, false);

                                                // Player is ready
                                                if (options.allowAutoplay && $video_player.parent().attr('data-autoplay') == 'yes') {
                                                    setTimeout(function () {
                                                        mediaElement.play();
                                                    },150);
                                                }

                                                // If we happen to have a video in the carousel, we will make the next / previous buttons available again on the carousel
                                                if ($video_player.hasClass("carousel-video")) {
                                                    setTimeout(function () {
                                                        $video_player.closest(".carousel").removeClass('hide-carousel-controls')
                                                    },200);
                                                }

                                                // HACK!
                                                // remove sketchy buffering sign (doesn't go on firefox)
                                                $video_player.find('.mejs-time-buffering').remove();
                                            }
                                        },
                                        error: function(a,b,c,d) {
                                            console.log(a);
                                            console.log(b);
                                            console.log(c);
                                            console.log(d);
                                        },
                                        enableKeyboard: options.enableKeyboard
                                    };

                                    // if progress disable
                                    if ( $video_player.parent().hasClass('e-disable-progress') ) {

                                        videoOptions.features = ['playpause','current','duration','tracks','volume','fullscreen']

                                        var newKeyActions = [];
                                        // if progressBar should be disabled - we need to clear certain actions
                                            // the key actions we don't want
                                        var keyKillList = [ 35,36,37,39 ];
                                        var intersection;
                                        for (var i = 0; i < mejs.MepDefaults.keyActions.length; i++) {
                                            // go through and see if the action is associated with one of our 'to kill ones'
                                            intersection = mejs.MepDefaults.keyActions[i].keys.filter(function(val) {
                                                return keyKillList.indexOf(val) != -1;
                                            });
                                            // if the key action is found - kill the action
                                            if (!intersection.length)
                                                newKeyActions.push( mejs.MepDefaults.keyActions[i] );
                                        }
                                        // otherwise - use the defaults
                                        videoOptions.keyActions = newKeyActions;
                                    }


                                    var player = new MediaElementPlayer( '#video'+ video_id, videoOptions );
                                    $video_player.data('player', player);

                                },me_delay);

                            } else {
                                // otherwise video is complete straight away
                                setTimeout(function(){
                                    $video_player.trigger('section_complete');
                                }, 150);
                                

                            }

                        } else if (video_object[0] == 'vimeo' || video_object[0] == 'embed') {

                            var isVimeo = video_object[0] === 'vimeo';
                            video_url = (video_object[1]+':'+video_object[2]);

                            w = $video_player.parent().width();// get it from its container, fits better
                            h = $video_player.height();
                            if (h <= 100)
                                h = Math.round(w / 16 * 9);

                            // check url type
                            video_url = video_url.replace('http:','https://');//+'?autoplay=1';
                            if (video_url.substring(0,2)=='//')
                                video_url = 'https:'+video_url;

                            if (isVimeo) {
                                // vimeo
                                // change vimeo URL
                                //http://vimeo.com/88907972 to
                                video_url = video_url.replace('\/vimeo.com\/','/player.vimeo.com/video/');
                                // must be https
                                video_url += '?badge=0&amp;color=ffffff';
                                // add a class to container
                                $video_player.parent().addClass('e-has-video');
                                $video_player.addClass('vimeo');
                            } else {
                                $video_player.parent().addClass('e-has-embed');
                                $video_player.addClass('embed');
                                $video_player.trigger('section_complete');
                            }
                            // otherwise no change

                            video_html = '<iframe id="video'+ (video_id) +'" src="'+ video_url+'" width="'+w+'" height="'+h+'" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
                            $video_player.html( video_html );
                            
                            if (isVimeo && typeof Vimeo !== 'undefined') {  
                                var vimeoPlayer = new Vimeo.Player($video_player);
                                vimeoPlayer.on("ended", function () {
                                    $video_player.trigger('section_complete');
                                });
                            } else if (typeof Vimeo === 'undefined') {
                                console.warn("Please make sure that the Vimeo player JS script is included in the min.js")
                            }                         
                            // class for reference
                            $video_player.addClass(video_object[0]);

                            $(window).resize(function() {
                                var $video_iframe = $('#video'+ (video_id));
                                var w = $video_iframe.parent().width(),
                                    h = Math.round(w / 16 * 9);
                                $video_iframe.width(w);
                                $video_iframe.height(h);
                            });

                        // brightcove player
                        } else if (video_object[0] == 'brightcove') {
                            // switch on auto play if enabled
                            var auto_play = $video_player.parent().attr('data-autoplay') == 'yes' ? ' autoplay ' : '';

                            // switch on loop if enabled
                            var loop = $video_player.parent().attr('data-loop') == 'yes' ? ' loop ' : '';

                            // script required to load video player appearance using customer IDs
                            var script_url = 'https://players.brightcove.net/'+video_object[2]+'/'+video_object[1]+'_default/index.min.js';   
                            
                            var videoid = "brightcove" + Date.now();
                            
                            // build video
                            video_html = '<div class="brightcove__wrap"><div class="brightcove__inner"><video id='+videoid+auto_play+loop+' data-video-id='+video_object[3]+' data-account='+video_object[2]+' data-player='+video_object[1]+' data-embed="default" data-application-id class="video-js" controls>'+track+'</video><script src="'+script_url+'"><\/script></div></div>';

                            $video_player.html(video_html);
                        
                            // listen for video complete event
                            var counter = 0;
                            var interval = setInterval(function() { 

                                // clear the interval once we've been trying for 10 seconds
                                if(counter++ === 20) {
                                    clearInterval(interval);
                                }

                                if(typeof(videojs) != 'undefined' && typeof(videojs.players[videoid]) != 'undefined') {
                                    videojs.players[videoid].ready(function() {
                                        var storeSelectedLanguage = function(tracks) {
                                            for (var i = 0; i < tracks.length; i++) {
                                                if (tracks[i].mode === 'showing') {
                                                    var trackLanguage = tracks[i].language.substr(0, 2);
                                                    if (trackLanguage) {
                                                        localStorage.setItem('video_subtitle_language', trackLanguage);
                                                    } else {
                                                        localStorage.removeItem('video_subtitle_language');
                                                    }
                                                }
                                            }
                                        };

                                        this.on("loadedmetadata", function () {
                                            var tracks = this.textTracks();

                                            // Get the stored language
                                            var storedLanguageSetting = localStorage.getItem('video_subtitle_language');

                                            if (storedLanguageSetting) {
                                                // Loop through captions
                                                for (var i = 0; i < tracks.length; i++) {
    
                                                    var trackLanguage = tracks[i].language.substr(0, 2);

                                                    // When the caption language equals the browser language, then set it as default
                                                    if (trackLanguage) {
                                                        // Set the language
                                                        if (trackLanguage === storedLanguageSetting) {
                                                            tracks[i].mode = "showing";
                                                        } else {
                                                            tracks[i].mode = "disabled";
                                                        }
                                                    }
                                                }
                                            }

                                            // Loop through and instantiate the modechange event listener
                                            // The event targets the document so we have no information as to which language was selected
                                            // So we trigger another loop that looks for the selected language
                                            for (var i = 0; i < tracks.length; i++) {

                                                // Bind the modechange event
                                                tracks[i].on("modechange", function(e) {
                                                    storeSelectedLanguage(tracks)
                                                });
                                            }
                                        });
                                    });

                                    videojs.players[videoid].on("ended", function() {
                                        $video_player.trigger('section_complete');
                                    });

                                    // clear interval once video is ready
                                    clearInterval(interval);
                                }
                                
                            }, 500);
                            
                            // add a class to container
                            $video_player.parent().addClass('e-has-video');
                            $video_player.addClass('brightcove');
                            if(isMobile) 
                                $video_player.addClass('e-is-mobile');

                        }
                        endScreenPosition($end_screen, $video_player);
                    }

                }
                $video_player.trigger('video_init');
                
                //resizing hidden videos on resizing. (mostly for the preview slider)
                var needsResizing = false;
                //if parent is a modal or the video is hidden, then when modals open check if the video is visible and resize it.
                $(window).on("resize", function(e){
                    if(!$video_player.is(":visible")){
                        //the resize has triggered but the video is not visible, so the resize will not function properly
                        needsResizing = true;
                    }
                })
                //whenever a modal opens we check if this video needs resizing, and if it is now visible and therefore able to be resized
                $(window).on("shown.bs.modal", function(){
                    if(needsResizing && $video_player.is(":visible")){
                        //if we need to resize (because it was invisible on previous window resize) then trigger the resize 
                        $(window).trigger('resize');
                        needsResizing = false;
                    }
                })




            });
            


        }
    });

    //Settings list and the default values
    $.fn.video.defaults = {
        enableKeyboard: true,
        videoBitRate: 1600,
        allowAutoplay: true
    };
    
})(jQuery);

(function (originalFunction) {
    // keep 
    var translations_json = {"none":"None","play":"Play","pause":"Pause","mute":"Mute","fullscreen":"Fullscreen"};
    
    if (translations_json && typeof translations_json === 'object') {
        var found_matches = false;
        // make sure the defaults are up to date - because - annoyingly - some of the 
        // text is stored on initialisation - with different key names
        for (var t in translations_json) {
            // there are a few translations that need to be done to cover the bases
            // Keys should be Ucfirst
            translations_json[ t.charAt(0).toUpperCase() + t.slice(1) ] = translations_json[t];
            // and the defaults are lowercase with Text on the end
            if (mejs.MepDefaults[t + 'Text'] && typeof mejs.MepDefaults[t + 'Text'] == "string")
                mejs.MepDefaults[t + 'Text'] = translations_json[t];
            // show that we've found some
            found_matches = true;
        }
        //mejs.i18n.t_originalFunction = originalFunction;
        // if that worked, then we can overwrite the translation function - to use these in place
        if (found_matches) {
            mejs.i18n.t = function (string_requested) {
                // There is a slight tension here, because the 'string_requested' is the English phrase - so could be 'None' - which works here, because it
                // is also the key, but could also be 'Captions/Subtitles' - which isn't a key - and so won't work. If that becomes a problem, then we might need
                // to rethink a bit.
                // if it's in the JSON - return it
                if (translations_json[ string_requested ])
                    return translations_json[ string_requested ];
                // otherwise fall back to original function 
                return originalFunction( string_requested );
            };
        }
    }
})(mejs.i18n.t);
// this is a jsonp loading function to take in subtitle tracks
var me_subtitle_register = [];
function me_subtitle_loader ( response ) {
	if (response.filename && response.subtitles) {
		var new_register = [];
		// go through the register
		for (var i in me_subtitle_register) {
			// if the filename matches one in the register
			if (me_subtitle_register[i].filename == response.filename) {
				// run the success function
				me_subtitle_register[i].success( response.subtitles );
			} else
				// otherwise readd into register
				new_register.push(me_subtitle_register[i]);
		}
		me_subtitle_register = new_register;
	}
}
// punch out the loadTrack function
MediaElementPlayer.prototype.loadTrack = function(index){
	var
		t = this,
		track = t.tracks[index],
		after = function() {
			track.isLoaded = true;
			// create button
			t.enableTrackButton(track.srclang, track.label);
			t.loadNextTrack();
		};
	
	var on_subtitle_load = function(d) {
		// parse the loaded file
		if (typeof d == "string" && (/<tt\s+xml/ig).exec(d)) {
			track.entries = mejs.TrackFormatParser.dfxp.parse(d);					
		} else {	
			track.entries = mejs.TrackFormatParser.webvtt.parse(d);
		}
		after();
		if (track.kind == 'chapters') {
			t.media.addEventListener('play', function(e) {
				if (t.media.duration > 0) {
					t.displayChapters(track);
				}
			}, false);
		}
		if (track.kind == 'slides') {
			t.setupSlides(track);
		}					
	};

	// IF IE9 - we will use the JSONP version of the file instead
	// This might not exist - but it won't be any more broken than it was before
	var xhr_support = (new XMLHttpRequest().upload && window.FormData && !window.XDomainRequest);

	if (!xhr_support) {
		// register success functions
		var track_path = track.src.replace('.srt','').replace('.vtt','')+'.js';
		// because we could have multiple subtitles at once here - all overlapping
		// and we lose the context of this function - we are registering each file with a success function
		me_subtitle_register.push({
			filename: track_path.split('/').reverse()[0],
			success: on_subtitle_load
		});

		// Fetch the subtitles via JSONP
		$.ajax(Object.assign({}, {
			url: track_path,
			dataType: 'jsonp',
			error: t.loadNextTrack
		}));
	} else {
		// Fetch the subtitles via a standard AJAX call
		$.ajax(Object.assign({}, {
			url: track.src,
			dataType: 'text',
			success: on_subtitle_load,
			error: t.loadNextTrack
		}));
	}
};
(function ($) {
    /**
     * https://elucidat.atlassian.net/browse/LI-2265
     * Fixes an issue where for some reason mediaelements decides to resize the time bar to 1px
     * We only need to adjust the sizes using JS if the browser does not support flexbox
     * If browser supports flexbox we style the time rail using flexbox and !important in `stylesheets/release/build/mediaelement.scss`
     */
    function fixPlayersTimeRail() {
        var $this = $(this);
        var $controls = $(this).find(".mejs-controls");
        var width = $controls.width();
        var $time_rail = $controls.find(".mejs-time-rail");
        if ($time_rail.css("width") === "1px") {
            $controls
                .children("div")
                .not(".mejs-time-rail")
                .each(function () {
                    var $div = $(this);
                    if ($div.is(":visible")) {
                        width = width - $div.outerWidth(true);
                    }
                });
            // to compensate for margins
            width = width - parseInt($time_rail.css("marginLeft"), 10) - parseInt($time_rail.css("marginRight"), 10);
            $time_rail.css("width", width + "px");
            $this.find(".mejs-time-total").css("width", width + "px");
        }
    }

    $(document).on("elucidat.page.ready", function (event) {
        var $html = $(this).find("html");
        var hasFlexbox = $html.hasClass("flexbox");
        if (!hasFlexbox) {
            var $players = $(".audio, .video_player");
            $players.on("controlsresize", fixPlayersTimeRail);
        }
    });

})(jQuery);
(function ($) {
    $.fn.extend({
        carousel_complete: function (options) {
            //Settings list and the default values
            var defaults = {};
            var options = $.extend(defaults, options);

            return this.each(function () {
                var $carousel = $(this);

                $carousel
                    .trigger("completable_section")
                    .addClass("e-completable-section");

                // object that stores each carousel slide ID and whether it has been seen or not
                var itemsHaveBeenSeen = {};
                
                $carousel.find(".item").each(function () {
                    var $item = $(this);
                    // @todo - this does not work where the $item is visible already - consider new approach based on .active class
                    itemsHaveBeenSeen[$item.attr("id")] = $item.is(":visible") && $item.height() ? true : false;
                });

                // When changing the carousel slide mark the active slide as having been seen
                $carousel.on("slid", function (event) {
                    var $activeItem = $carousel.find(".item.active");
                    var activeItemId = $activeItem.attr("id");

                    if (activeItemId) {
                        itemsHaveBeenSeen[activeItemId] = true;

                        // see if all parts have been seen
                        var complete = true;
                        for (var item in itemsHaveBeenSeen) {
                            if (!itemsHaveBeenSeen[item]) {
                                complete = false;
                            }
                        }

                        // send complete event if so
                        if (complete) {
                            $carousel.trigger("section_complete");
                        }
                    }

                    // Fix video players inside carousels
                    $activeItem.find("div.video_player").each(function () {
                        var $videoPlayer = $(this);
                        // If we don't have a video_player but not a video in the dom,
                        // it implies that mejs has not loaded, so we scrap the previous video and start again for this element only.
                        if ( $videoPlayer.is(":visible") && $videoPlayer.find("video").length <= 0 ) {
                            // Add a class so we know this is a video in a carousel
                            $videoPlayer.addClass("carousel-video");
                            // Add a class to the carousel to hide the next / previous button of the carousel whilst the video loads
                            // We do this because if the user keeps clicking the next button it is possible that a video that is being initialised
                            // will try and load to the size of an element that is no longer in the dom, which causes them to become far too large
                            // this class gets removed once the video loads `javascript/release/build/mediaelement/jquery.video.js`
                            $carousel.addClass("hide-carousel-controls");
                            $videoPlayer.video_destroy().video();
                        }
                    });
                });
            });
        }
    });
})(jQuery);
(function($){
    $.fn.extend({
        collapse_complete: function(options) {

            //Settings list and the default values
            var defaults = {};
            var options = $.extend(defaults, options);

            return this.each(function() {

                var $collapse = $(this);

                if($collapse.prop("tagName") === 'A' || $collapse.prop("tagName") === 'BUTTON') {
                    //The selector that calls this wil have already initialised any div.collapse elements so we don't need to do it here.
                    if($collapse.parent().hasClass('collapse')) {
                        return;
                    }
                    $collapse = $collapse.parent();
                }
                
                //make sure all flipcards are marked as individual completable sections
                if($collapse.hasClass("flipcard") || $collapse.hasClass("eFlipcard__card-body")){
                    $collapse.trigger('completable_section').addClass('e-completable-section');
                }



                if ($collapse.hasClass('answered_incorrect') ||
                    $collapse.hasClass('answered_correct') ||
                    $collapse.hasClass('answered_partially_correct') ||
                    $collapse.hasClass('answered')) {
                    return;
                }

                // and listen for the show
                $collapse.on('shown', function () {
                    $collapse.trigger('section_complete');
                });

                //Sections that are visible when the page loads will never be showen so don't track them as viewable sections.
                //We have to wait briefly here in case there is a fade when the page is shown.
                setTimeout(function() {
                    if (!$collapse.is(':visible') || !$collapse.height() || parseFloat( $collapse.css('opacity') ) === 0) {
                        $collapse.trigger('completable_section').addClass('e-completable-section');
                    }
                }, 250);


            });
        }
    });

})(jQuery);



(function($){
    $.fn.extend({
        modal_complete: function(options) {
        
            //Settings list and the default values
            var defaults = {};
            var options = $.extend(defaults, options);
            
            return this.each(function() {
                
                var $collapse = $(this);
                
                if (!$collapse.hasClass('answered_incorrect') && !$collapse.hasClass('answered_correct') && !$collapse.hasClass('answered_partially_correct') && !$collapse.hasClass('answered')) {
                    // set up the item
                    // if not visible
                    if (!$collapse.is(':visible') || !$collapse.height()) {
                        // init
                        $collapse.trigger('completable_section').addClass('e-completable-section');
                        // IF the collapse or modal has completable sections itself - then we wait for 
                        // whatever the sub-item is before we complete
                        // slight delay to let the completable sections to be registered
                        // (as the event is on close there's no great hurry)
                        setTimeout(function () {
                            // if there are no child completable sections - add a close listener 
                            var $completable = $collapse.find('.e-scorable-section,.e-completable-section');
                            if (!$completable.length) {
                                // and listen for the modal to hide
                                $collapse.on('hidden.bs.modal', function () {
                                    $collapse.trigger('section_complete');
                                });
                            // and if there are - when any of the completable bits are complete - 
                            // we also need to complete the modal
                            } else {
                                $completable.on('section_complete',function () {
                                    $collapse.on('hidden.bs.modal', function () {
                                        $collapse.trigger('section_complete');
                                    });
                                });
                            }
                            
                        },100);
                    }
                }
                
            });
        }   
    });
        
})(jQuery);



(function($){
    $.fn.extend({
        tabs_complete: function(options) {
        
            //Settings list and the default values
            var defaults = {};
            var options = $.extend(defaults, options);
            
            return this.each(function() {
                var $collapse = $(this);
                if (!$collapse.is(':visible') || !$collapse.height()) {
                    // init
                    $collapse.trigger('completable_section').addClass('e-completable-section');
                    // find the related link
                    var pane_id = $collapse.attr('id');
                    $collapse.parents('#paw').find('a[href=#'+pane_id+']').on('shown', function () {
                        // mark this one as complete
                        $collapse.trigger('section_complete');
                    });
                }
            });
        }   
    });
        
})(jQuery);


var PageProgress = PageProgress || {};

PageProgress.show_progress_status = function ( section_code ) {
    
    // change classes according to the page progress status
    var menu_data = this.page_sections_data[section_code];
    
    if (menu_data && menu_data.$menuItem) {
        
        if (menu_data.has_common_class || menu_data.has_scorable || menu_data.has_completable) {
            
            var applied_classes = [];
            var removed_classes = [];
            
            
            // if the section has scorable elements
            if (menu_data.has_scorable) {
                applied_classes.push('e-is-scorable');
                
                var all_scored = true;
                for (var c in menu_data.scorable_children){
                    if (menu_data.scorable_children[c] !== true) {
                        all_scored = false;
                    }
                }
                
                if (all_scored) {
                    applied_classes.push('e-all-answered');
                }
            }
            // if the section has completable elements
            if (menu_data.has_completable) {
                applied_classes.push('e-is-completable');
                
                var all_completed = true;
                for (var d in menu_data.completable_children) {
                    if (menu_data.completable_children[d] !== true) {
                        all_completed = false;
                    }
                }
                if (all_completed) {
                    applied_classes.push('e-all-completed');
                }
            }
            
            // now add classes
            menu_data.$menuItem.addClass( applied_classes.join(' ') );
            
            // find the percentage seen of each item
            var item_seen_percentage = menu_data.$object.has_been_on_screen();
            
            // less than 20% probably isn't readable
            if (item_seen_percentage < 30)
                item_seen_percentage = 0;
            
            // we limit percentage if scored things haven't been scored, or completable things haven't been completed
            // if ((menu_data.has_scorable && !all_scored) || (menu_data.has_completable && !all_completed))
            //     item_seen_percentage /= 2;
            
            var $percentage_output = menu_data.$menuItem.find('.e-js-progress-percentage')
            if ( $percentage_output.length ) {
                $percentage_output.each(function() {
                    var $output = $(this);
                    if ( $output.hasClass('e-js-progress-percentage-text'))
                        $output.text( item_seen_percentage);
                    
                    else if ( $output.hasClass('e-js-progress-percentage-bar'))
                        $output.css('width', item_seen_percentage+'%' );
                    
                    else if ( $output.hasClass('e-js-progress-percentage-circular')) {
                        var $circle = $output.find('circle');
                        $circle.attr({ 'stroke-dashoffset': (100-item_seen_percentage) });
                    }
                });
            }
            
            // check if the section is on the screen
            var obj_bounds = menu_data.$object.get(0).getBoundingClientRect();
            if ( obj_bounds.top > 0 && obj_bounds.bottom < $(window).height() ) {
                menu_data.$menuItem.addClass('e-section-active');
            }
            else {
                menu_data.$menuItem.removeClass('e-section-active');
            }

            function setAriaLabel ($menuDataItem) {
                var link =  $menuDataItem.find("a");
                var titleTextAttr = link.attr("data-title");
                var completedLabel = titleTextAttr + " completed";
                link.attr("aria-label", completedLabel);
            }
            
            // mark section as completed
            if (item_seen_percentage == 100) {
                
                if ( menu_data.has_scorable && menu_data.has_completable ) {
                    if ( all_scored && all_completed ) {
                        menu_data.$menuItem.addClass('e-section-completed');
                        setAriaLabel(menu_data.$menuItem);
                    }
                } else if ( menu_data.has_scorable ) {
                    if ( all_scored ) {
                        menu_data.$menuItem.addClass('e-section-completed');
                        setAriaLabel(menu_data.$menuItem);
                    }
                } else if ( menu_data.has_completable ) {
                    if ( all_completed ) {
                        menu_data.$menuItem.addClass('e-section-completed');
                        setAriaLabel(menu_data.$menuItem);
                    }
                } else {
                    menu_data.$menuItem.addClass('e-section-completed');
                    setAriaLabel(menu_data.$menuItem);
                }
            }
            
            // if (item_seen_percentage > 0 && item_seen_percentage < 100)
            //     menu_data.$menuItem.addClass('e-section-active');
            // 
            // else {
            //     menu_data.$menuItem.removeClass('e-section-active');
            //     
            //     if (item_seen_percentage == 100)
            //         menu_data.$menuItem.addClass('e-section-completed');
            // }
        }
    }
};

var PageProgress = PageProgress || {};

PageProgress.ScrollListener = {
    clear: function () {
        // turn off events
        $(window).off('scroll.page_progress');
        // and clear callbacks
        PageProgress.ScrollListener.callbacks = [];
        PageProgress.ScrollListener.is_started = false;
    },
    register: function ( callback ) {
        PageProgress.ScrollListener.callbacks.push( callback );
        
        // and start it, if not started already
        if (!PageProgress.ScrollListener.is_started) {
            PageProgress.ScrollListener.is_started = true;
            PageProgress.ScrollListener.init();
        }
    },
    init: function () {
        $(window).on('scroll.page_progress',function () {
            waitForFinalEvent(function(){
                // go through items in page_sections_data, and work out
                // if one wasn't on screen, but now is
                // and if so change it's status
                for (var i = 0; i < PageProgress.ScrollListener.callbacks.length; i++)
                    PageProgress.ScrollListener.callbacks[i]();
                
            }, 250, "page_progress_scroller");
        });
    }
};

var PageProgress = PageProgress || {};


PageProgress.find_sections_in_page = function ( $object_to_search ) {
    // save initial values
    var classes = {};
    // reset page sections
    this.page_sections_data = {};
    // 
    var $children = $object_to_search.children();
    // console.log($children.length)
    
    
    // if there aren't many children - reverse
    
    
    if ($children.length < 4) {
        // console.log('less than 4 children')
        return false;
    }
    
    
    var section_number = 0;
    $children.each(function (i) {
        // first - we go through to find the most popular class (which we will guess to be the most popular item)
        var $child = $(this);
        var child_id = $child.attr('id');
        var section_number = i < 10 ? '0'+i : i; // make it double digitas
        // generate a section code using the section number and section ID, this is so that they display in order
        var section_code = section_number+'-'+child_id;
        
        // remove on cleanup
        if ( $child.hasClass('e-js-progress-ignore') ) {
            // ignore the elements that are being injected
            return;
        }
        
        
        if ( $child.attr('id') ) {
            
            //////////////////////////////
            // SECTION TITLE 
            //////////////////////////////
            
            // find the title for the section
            var $title = $child.find('h1,h2,h3,h4,h5').not('.modal :header').first();
            
            // if there is not Hx tag look for different titles
            if ( !$title.length ) {
                
                // if the previews doesnt work check if there is a title preceding the element
                if ( !$title.length && $child.prev().is(':header')  ) {
                    $title = $child.prev();
                }
                // if that also doesn't work look for the first paragraph
                else if ( $child.find('p, .text, .button__text').length  ) {
                    $title = $child.find('p, .text, .button__text').first();
                }
                // no title :(
                else if ( $child.hasClass('video') || $child.hasClass('interactiveVideo') ) {
                    // doesnt work because the video only loads after this code has run
                    // var videoIframe = $($child).find('.mejs-inner');
                    // var innerDoc = videoIframe.contentDocument || videoIframe.contentWindow.document;
                    // $title = $innerDoc.find('title').first();
                    
                    // for now use simply the word video_margin
                    $title = 'video';
                }
                // no title :(
                else {
                    $title = ' ';
                }
            }
            
            
            // make sure it is a string
            $title = (typeof $title == 'string') ? $title : $title.text();
            
            // keep it to a maximum of 50 characters - don't clip if it will hide less than 10 characters
            if ($title.length > 50) {
                $title = $title.substr(0, 40)+'...';
            }
            
            
            /////////////////////////////
            // GET CLASSES
            /////////////////////////////
            
            // and record the classes of the item
            var classes_of_item = $child.attr('class').split(' ');
            var cl;
            
            for (var c = 0; c < classes_of_item.length; c++ ) {
                cl = classes_of_item [c];
                // sets item up as array if it's new
                if (!classes[cl]) {
                    classes[cl] = 0;
                }
                // record a list of items that match    
                classes[cl]++;
            }
            
            
            /////////////////////////////
            // STORE DATA
            /////////////////////////////
            
            // page_sections_data[ $child.attr('id') ] = {
            PageProgress.page_sections_data[ section_code ] = {
                title                   : $title,
                completable_children    : {},
                has_completable         : false,
                scorable_children       : {},
                has_scorable            : false,
                '$object'               : $child,
                has_common_class        : false
            };
        }
    });
    
    // now we have an array of all the most popular classes
    // let's work out which one to use
    var most_common_class = Object.keys(classes).reduce(function(a, b){ return classes[a] > classes[b] ? a : b });
    // console.log(most_common_class)
    
    // if there aren't many children - reverse
    if (most_common_class <= 2) {
        return false;
    }
    // console.log('most common', most_common_class)
    
    
    // now go through each child, and make a 'section' if 
    // has most common class OR has scorable elements OR has completable elements
    $children.each(function (i) {
        // scope out the child item
        var $child = $(this);
        var child_id = $child.attr('id');
        var section_number = i < 10 ? '0'+i : i; // make it double digitas
        // generate a section code using the section number and section ID, this is so that they display in order
        var section_code = section_number+'-'+child_id;
        
        // var prefix = i.toString()
        // console.log(child_id)
        
        
        if ($child.hasClass( most_common_class )) {
            // @todo - should we look at ignoring EMPTY sections too?
            if (PageProgress.page_sections_data[ section_code ]) {
                PageProgress.page_sections_data[ section_code ].has_common_class = true;
            }
        }
        if (PageProgress.page_sections_data[ section_code ]) {
            $child.on('completable_section', function(e) {
                var completable_id = $(e.target).attr('id');
                // add this to the sections completable list
                PageProgress.page_sections_data[ section_code ].completable_children[ completable_id ] = false;
                // and record that there are completable
                PageProgress.page_sections_data[ section_code ].has_completable = true;
                
                // then listen for completion
                $(e.target).on('section_complete', function(e) {
                    PageProgress.page_sections_data[ section_code ].completable_children[ completable_id ] = true;
                    // report a page_progress change to the menu
                    PageProgress.show_progress_status ( section_code );
                });
                
                // report a page_progress change to the menu
                // PageProgress.show_progress_status ( section_code );
            });
            // now repeat for scoreables
            $child.on('scorable_section', function(e) {
                var scorable_id = $(e.target).attr('id');
                // add this to the sections completable list
                PageProgress.page_sections_data[ section_code ].scorable_children[ scorable_id ] = false;
                // and record that there are completable
                PageProgress.page_sections_data[ section_code ].has_scorable = true;
                
                // then listen for completion
                $(e.target).on('answered', function(e) {
                    PageProgress.page_sections_data[ section_code ].scorable_children[ scorable_id ] = true;
                    // report a page_progress change to the menu
                    PageProgress.show_progress_status ( section_code );
                });
                
                // report a page_progress change to the menu
                // PageProgress.show_progress_status ( section_code );
            });
            
            // register on scroll action for this section
            PageProgress.ScrollListener.register (function () {
                PageProgress.show_progress_status(section_code);
            });
            
        }
    });
    // console.log(page_sections_data)
    return true;
};

(function($){
    $.fn.extend({
        has_been_on_screen: function(options) {
            
            var element = this.get(0);
            var bounds = element.getBoundingClientRect();
            
            // split the element into 10 virtual 'slots' and see which ones of them HAVE BEEN on screen - gives us a good sense of percentage an item has been seen
            // we'll store the results so that an element is gradually all 'seen' over a series of scroll events
            var seen_data = $(this).data('seen_on_screen');
            var seen_percentage = $(this).data('seen_percentage');
            // overall percentage - if 1 - return immediately
            if (seen_percentage > 95)
                return 100;
                
            else {
                // reevaluate seen percentage
                seen_percentage = 0;
                
                // record which of the slots have been seen
                if (!seen_data) 
                    seen_data = [0,0,0,0,0,0,0,0,0,0];
                    
                var item_height = bounds.bottom - bounds.top;
                if (item_height && item_height > 0) {
                    for (var i = 0; i < 10; i++) {
                        // only assess if this hasn't been seen already
                        if (!seen_data[i])
                            seen_data[i] = bounds.top + (item_height/10 * i) < window.innerHeight && bounds.bottom > 0 ? 1 : 0;
                        // keep track of overall percentage
                        if (seen_data[i])
                            seen_percentage += 10;
                    }
                }
                
                // save for next run
                $(this).data('seen_on_screen', seen_data);
                $(this).data('seen_percentage', Math.round(seen_percentage));
                
                return seen_percentage;
            }
        }    
    });
})(jQuery);


(function($) {
    $.fn.extend({
        page_progress_bar: function(options) {
            //Settings list and the default values
            var defaults = {};
            var options = $.extend(defaults, options);
            
            var page_progress_reached = 0;
            
            return this.each(function() {
                
                var $progress_bar = $(this).find('.e-js-bar');
                
                if ($progress_bar.length) {
                    var update_bar = function ( mode ) {
                            
                        //https://stackoverflow.com/questions/2387136/cross-browser-method-to-determine-vertical-scroll-percentage-in-javascript
                        var s = $(window).scrollTop(),
                            d = $(document).height(),
                            c = $(window).height();

                        var scrollPercent = (s / (d-c)) * 100;
                        
                        // show the maximum achieved progress
                        if (scrollPercent > page_progress_reached)
                            page_progress_reached = scrollPercent;
                        
                        // and print out the progress bar
                        $progress_bar.width( page_progress_reached + '%');
                        
                    };
                    
                    update_bar();
                    
                    // register for updates on scroll
                    PageProgress.ScrollListener.register ( update_bar );
                }
            });
        }
    });
    
})(jQuery);


(function($) {
    $.fn.extend({
        page_progress_menu: function(options) {
            
            //Settings list and the default values
            var defaults = {};
            var options = $.extend(defaults, options);
            
            return this.each(function() {
                
                // find the html, which should be json
                var $page_progress = $(this);
                var $page_progress_menu = $page_progress.find('.e-js-progress-menu');
                
                
                var $paw = $page_progress.closest('#paw');
                
                // template for menu
                var $template = $page_progress_menu.children().first().clone();
                $template.find('.menu__item__icon').append('<svg class="progress-svg" x="0px" y="0px" width="36px" height="36px" viewBox="0 0 36 36">'+
                                '<circle class="progress-svg__circleOutline" fill="none" stroke-width="1" cx="18" cy="18" r="17"></circle>'+
                                // the circle radius must be 16 because 2*pi*16 = 100 - which is the maximum progress we can get
                                '<circle class="progress-svg__circle" fill="none" stroke-width="2" cx="18" cy="18" r="16" stroke-dasharray="100" stroke-dashoffset="100"></circle>'+
                                '</svg>');
                // empty out the menu
                $page_progress_menu.empty();
                
                // first, we need to find the sections that are completeable
                
                // recursive search looking for likely long page content
                var $tpaw = $paw;
                var has_found_sections;
                
                for (var c = 0; c < 5; c++) {
                    has_found_sections = PageProgress.find_sections_in_page( $tpaw );
                    
                    if (has_found_sections === false) {
                        
                        // IF (there are no children OR the element has an ignore) move on to the next element
                        if ( !$tpaw.children().length || $tpaw.hasClass('e-js-page-progress-ignore')) {
                            // console.log($tpaw, 'ignore this element')
                            $tpaw = $tpaw.next();
                            continue;
                        }
                        
                        
                        // IF (the element is made of columns) check which column has more children as that's likely to be where the content is
                        if( $tpaw.hasClass('col_num--2')) {
                            var $col_1 = $tpaw.find('> .col--left > .col__inner');
                            var $col_2 = $tpaw.find('> .col--right > .col__inner');
                            
                            var elements_in_col_1 = $col_1.length ? $col_1.children().length : 0;
                            var elements_in_col_2 = $col_2.length ? $col_2.children().length : 0;
                            
                            $tpaw = (elements_in_col_1 > elements_in_col_2) ? $col_1 : $col_2;
                        }
                        else {
                            $tpaw = $tpaw.find(">:first-child");
                        }
                        
                        
                        if (!$tpaw.length) {
                            break;
                        }
                    } 
                    else {
                        break;
                    }
                }
                
                if (!has_found_sections) {
                    $page_progress.remove();
                    return;
                }
                
                // now we'll pause for a second to let the completeable events to come through
                setTimeout(function () {
                    
                    // then, we need to build the menu (by copying the first child)
                    var $h1, section_data, section_id, $menuItem;
                    
                    // console.log(page_sections_data)
                    for (var section_code in PageProgress.page_sections_data ) {
                        section_data = PageProgress.page_sections_data[section_code];
                        section_id = section_data.$object.attr('id');
                        
                        if (section_data.has_common_class || section_data.has_scorable || section_data.has_completable) {
                            // build the menu
                            $menuItem = $template.clone();
                            $page_progress_menu.append($menuItem);
                            
                            // find the link - and associate it
                            // insert the link - as an anchor
                            $menuItem.find('a').attr('href', '{{navigation.' + section_id + '.internal}}' );
                            // fix link - corrects links to work inside the page
                            $menuItem.find('a,button[href]').fix_links( e.elucidat );
                            
                            if (section_data.title) {
                                // insert the title into the menu item
                                $menuItem.find('.e-js-progress-itemName').text( section_data.title );
                            }
                            // record reference to $menuItem
                            PageProgress.page_sections_data[ section_code ].$menuItem = $menuItem;
                            
                            // now do the visual updates
                            // PageProgress.show_progress_status ( section_code );
                        }
                    }
                    
                }, 750);
                
            });
        }
    });
    
    
})(jQuery);


(function($){
    $.fn.extend({
        scroll_to: function(scrollTargetY, speed, easing) {
            var scrollY = window.scrollY,
                scrollTargetY = scrollTargetY || 0,
                speed = speed || 2000,
                easing = easing || 'easeOutSine',
                currentTime = 0;

            // min time .1, max time .8 seconds
            var time = Math.max(.1, Math.min(Math.abs(scrollY - scrollTargetY) / speed, .8));

            // easing equations from https://github.com/danro/easing-js/blob/master/easing.js
            var PI_D2 = Math.PI / 2,
                easingEquations = {
                    easeOutSine: function (pos) {
                        return Math.sin(pos * (Math.PI / 2));
                    },
                    easeInOutSine: function (pos) {
                        return (-0.5 * (Math.cos(Math.PI * pos) - 1));
                    },
                    easeInOutQuint: function (pos) {
                        if ((pos /= 0.5) < 1) {
                            return 0.5 * Math.pow(pos, 5);
                        }
                        return 0.5 * (Math.pow((pos - 2), 5) + 2);
                    }
                };

            // add animation loop
            function tick() {
                currentTime += 1 / 60;

                var p = currentTime / time;
                var t = easingEquations[easing](p);

                if (p < 1) {
                    requestAnimFrame(tick);

                    window.scrollTo(0, scrollY + ((scrollTargetY - scrollY) * t));
                } else {
                    window.scrollTo(0, scrollTargetY);
                }
            }

            // call it once to get started
            tick();

        }
    });

})(jQuery);

(function($){
    $.fn.extend({
        wait_until_on_screen: function(options) {
            //Settings list and the default values
            var defaults = {
                callback: function () {},
                percentageRequired: 20
            };
            var options = $.extend(defaults, options);
            
            var $item = $(this);
            var test_on_screen = function () {
                if ($item.length) {
                	var on_screen = $item.has_been_on_screen();
                    // keep going until at least 20 percent on screen
                	if ( on_screen > options.percentageRequired )
            			options.callback();
            		else
            			setTimeout(test_on_screen, 200);
                }
        	};
        	test_on_screen();
        }    
    });
})(jQuery);
// add requestAnimFrame shim
// http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        function( callback ){
            window.setTimeout(callback, 1000 / 60);
        };
})();

(function($){
    
    $.fn.extend({
        card_stack: function(options) {
            
            //Settings list and the default values
            var defaults = {
                maxVisible : 3,
                exclude: null
            };
            
            options = $.extend(defaults, options);
            
            function setStackStyle( el, i, reverse ) {
                var tval = 'translate3d(0,'+ (10*i) +'px,0) scale('+ (1-(0.05*i)) +')';
                
                el.css({
                    'position': el.css('position') == 'absolute' ? ' ' : 'absolute',
                    'top': '0',
                    'left': '0',
                    'z-index': reverse,
                    'transform': tval,
                    'box-shadow': el.css('box-shadow') ? ' ' : '0 10px 7px -7px rgba(0,0,0,0.12), 0 0 4px rgba(0,0,0,0.1)',
                    'opacity': i < options.maxVisible ? 1 : 0
                })
            }
            
            return this.each(function() {
                // options
                var exluded = options.exclude
                
                var $container = $(this);
                var $inner = $container.find('.grid__inner');
                
                var $cards = $container.find('.card:not('+exluded+')');
                var num_cards = $cards.length;
                
                var $card;
                for (var i = 0; i < num_cards; i++) {
                    $card = $($cards[i]);
                    $card.addClass('e-is-stacked')
                    $card.attr('tabindex', i === 0 ? '0' : '-1')
                    setStackStyle($card, i, num_cards-i)
                }
                
                // make sure grid inner's height is enough to hold the cards
                $('body').one('elucidat.page.ready',function() {
                    var biggest_height = 0;
                    $cards.each(function() {
                        $card = $(this);
                        var card_height =  $card.height()
                        
                        biggest_height = card_height > biggest_height ?
                        card_height : biggest_height;
                    })
                    $inner.css('min-height', biggest_height)
                });
                
            });
        }
    });
    
})(jQuery);    

// SOME NOTES ABOUT THIS FUNCTION BECAUSE IT GETS A BIT COMPLICATED
// there are 3 different objects with very similar names: page.answer, page.answer[n].answer, page.answers
// page.answer              - object that stores the data for the questionnaires that the user has answered
// page.answer[n].answer    - object stores the answer(s) selected by the user on that particulat question
// page.answers             - stores the analytics data for the questionnaires on that page (how many people picked each of the options)




(function($){

    function check_graph_style ( $chart ) {
        // create a temporary element to extract the styles from the colorways
        var $placeholder_key = $('<span class="key e-hide"></span>');
        var $placeholder_key_item = $('<span class="item"></span>');
        var $style_helper = $('<div class="e-graph-style-helper"></div>');
        $placeholder_key.append($placeholder_key_item, $style_helper);
        $chart.append($placeholder_key);
        
        // get the style from the helper
        // the font size needs to be only the value, without the px
        var font_color = $placeholder_key_item.css('color');
        var font_size = parseInt($placeholder_key_item.css('font-size'));
        var font_family = $placeholder_key_item.css('font-family');
        // assume it is not responsive (old default)
        // if helper height is 1px make responsive = true
        var is_responsive = false;
        is_responsive = ($style_helper.css('height') == '1px') ? true : false;
        
        // remove the helper
        $placeholder_key.remove();
        
        return {
            graph_is_responsive: is_responsive,
            graph_font_color: font_color,
            graph_font_size: font_size,
            graph_font_family: font_family
        };
    }

    function populateBar ( options ) {
        return {
            labels : options.labels,
            datasets : [
                {
                    fillColor : options.colors[0],
                    data : options.data
                }
            ]
        };
    }

    function populatePie ( options ) {
        var return_data = [];
        
        // count the total number of swatches so as to know when to start looping
        var totalSwatchesN = 0;
        
        for (var i = 0; i < options.data.length; i++) {
            
            if (options.colors[i]) {
                totalSwatchesN++;
            }
            
            return_data.push({
                value: options.data[i],
                // if the colour exists use it if not start looping
                color: options.colors[i] ? options.colors[i] : options.colors[(i - totalSwatchesN)]
            });
        }
        return return_data;
    }

    function makeLabels ( options ) {
        var $item = $('<div class="key"></div>'), $key;
        for (var i = 0; i < options.data.length; i++) {
            $key = $( '<div class="item"><span class="color"></span> <span class="text">'+options.labels[i]+'</span> <span class="value"></span></div>' );
            $key.find('span.color').css({
                'background-color': options.colors[i] ? options.colors[i] : options.colors[0]
            });
            $key.find('span.value').text('(' + options.data[i] + ')');
            $item.append($key);
        }
        return $item;
    }

    function howYouAnswered(clip) {
        // Takes a clip and returns a string showing the learner's responses to a given page or question.
        // clips can be in the format chart:1:586bb7fa0035c:question-1 or chart:1:586bb7fa0035c
        // question_id is used to get the response to a specific row in either a likert or multi response. https://docs.google.com/document/d/1sB6y7_4H7kONj7NkqJxGmO2sHJu4JVv5YzwRUxiHc5o/edit#bookmark=id.svzorutw8sn4
        //TODO: support multiple question parts on the same page.
        var split = clip.split(':'),
            page_id = split[2],
            page = e.elucidat.pages[page_id],
            answer_id = split[3],
            pageQuestions = page.answer;
            
        //should output a text list of all the learners answers for all questions on the page.
        var how_you_answered_arr = [];
        
        for(var i = 0; i<pageQuestions.length; i++) {
            // If we are looking for a specific answer id (the clip has specified one) then only add that one,
            // otherwise add all the answers.
            var question = pageQuestions[i],
                answer_array = question.answer,
                choices      = question.choices;
                
            // likerts use a scale not a choices so we need to put this in to make sure
            // likerts can be used in the how you answer clip.    
            if(question.scale) {
                choices = question.scale;
            }
            
            var currentAnswerLessPartCode = question.interaction_id.substring(question.interaction_id.indexOf('-') + 1);
            
            if( answer_id === currentAnswerLessPartCode || !answer_id ) {
                var answerTexts = [];
                for (var j = 0; j < answer_array.length; j++) {
                    // We wont just use the answer, as its been sanatised. 
                    // Get it from the description instead
                    // var question_id = answer_array[j].split('[:]')[0];
                    
                    var question_id = answer_array[j].toString();
                    if ( question_id.indexOf('[:]') !== -1 ) {
                        // this bit is simply to have it working on local since the object keys look different in local and live
                        // on local => p163b11a0e45-answer-1
                        // on live => p163b11a0e45-answer-1[:]Answer Text
                        question_id = question_id.split('[:]')[0];
                    }
                    
                    for (var index in choices) {
                        if(choices[index]['id'] == question_id){
                            answerTexts.push(choices[index]['description']['en-US']);
                            break;
                        }
                    }
                }
                how_you_answered_arr.push(answerTexts.join([', ']));

                //if we are looking for a specific answer id and we found it, stop looking.
                //TODO: Known issue: multiple questions on a page (but in different parts) can share the same id...
                //...any further answers with this ID won't be displayed.
                if(answer_id === currentAnswerLessPartCode) {
                    break;
                }
            }
        }
        return how_you_answered_arr.join(', ');
    }

    $.fn.extend({
        charts: function( Elucidat ) {
            
            function randombetween(min, max) {
                return Math.floor(Math.random()*(max-min+1)+min);
            }
            
            return this.each(function() {
                var $this = $(this);
                // console.log('this', $this)
                // now populate real data, if we have it
                // if we have it, the last bit of this item's id should refer to 
                
                var achievement_parts = $this.attr('data-chart') ? $this.attr('data-chart') : $this.attr('id');
                achievement_parts = achievement_parts.split(':');
                // if length is 4 - we have a question id
                var achievement_id, question_id;
                
                if (achievement_parts.length === 4) {
                    achievement_id = achievement_parts[ achievement_parts.length - 2];
                    question_id = achievement_parts[ achievement_parts.length - 1];
                } else {
                    achievement_id = achievement_parts[ achievement_parts.length - 1];
                }
                
                var total = 0;          // variable to store the total number of people that answered this question
                var same_as_you = 0;    // variable to store the number of people that selected the same answer
                
                
                // checkpoint - stop if there's no Elucidat object or an achievement ID
                if ( Elucidat && achievement_id ) { // only continue if we have this 2 bad boys
                    
                    // FIND THE RIGHT PAGE
                    var page = null;
                    // it's either an achievement_id OR a page_id
                    var page_id = Elucidat.achievements [ achievement_id ];
                    if (page_id) {
                        page = Elucidat.pages [ page_id ];
                    }
                    else {
                        page = Elucidat.pages [ achievement_id ];
                    }

                    var isPlaceholder = false;
                    
                    // checkpoint - stop if there is no page data
                    if ( page && page.answers ) {
                        
                        var analyticsData = {}; // object created to store the answers given by everyone that took the course
                        
                        
                        // If there is no analytics data for the question generate placeholder data to populate the graphs
                        if ( $.isEmptyObject(page.answers) ) {
                            
                            if ( page.fakeAnalytics === undefined ) {
                                // store fakeAnalytics (created below) against the page object so that we can reutilize it if there are multiple graphs pointing to the same question
                                page.fakeAnalytics = {};
                            }
                            else if ( page.fakeAnalytics.graph1 ) {
                                delete page.fakeAnalytics.graph1;
                            }
                            
                            if ( !page.answer.length ) {
                                // IF the user has not answered the page generate random labels and numbers
                                var dummyData = {
                                    'graph1': {
                                        '1[:]Answer 1': Math.floor(Math.random() * 60) + 1,
                                        '2[:]Answer 2': Math.floor(Math.random() * 60) + 1,
                                        '3[:]Answer 3': Math.floor(Math.random() * 60) + 1,
                                        '4[:]Answer 4': Math.floor(Math.random() * 60) + 1,
                                        '5[:]Answer 5': Math.floor(Math.random() * 60) + 1,
                                        '6[:]Answer 6': Math.floor(Math.random() * 60) + 1
                                    }
                                };
                                jQuery.extend(true, page.fakeAnalytics, page.answers, dummyData);
                                analyticsData = jQuery.extend(true, {}, dummyData);
                                isPlaceholder = true;
                            }
                            else {
                                // this bit of code generates random data to fill charts and clips using stored question data to figure out how many options there were and what the text was
                                // If the user has answered the page we have stored data of the labels so lets use that
                                var realTextFakeNumbers = {};
                                
                                for (var i = 0; i < page.answer.length; i++) {
                                    var index = i;
                                    var thisAnswer = page.answer[index];
                                    var questionID = thisAnswer.interaction_id;
                                    
                                    if ( page.fakeAnalytics[questionID] ) {
                                        break;
                                    }
                                    
                                    realTextFakeNumbers[questionID] = {};
                                    var options = thisAnswer.choices ? 'choices' : 'scale'; // options can be either "choices" or "scale" (likert)
                                    
                                    if ( thisAnswer[options] ) {
                                        var thisAnswerOptions = thisAnswer[options];
                                        var numOptions = thisAnswerOptions.length;
                                        
                                        // below there is some goodCode™ to generate random graph data
                                        // number of random answers always add to 100
                                        var addUpTo = 100;
                                        var remaining = 100;
                                        var currenTotal = 0;
                                        
                                        for (var j = 0; j < numOptions; j++) {
                                            var option_id = thisAnswerOptions[j].id;
                                            var option_text = thisAnswerOptions[j].description['en-US'];
                                            var optionIdentifier = option_id+'[:]'+option_text;
                                            
                                            var randomN = 0;
                                            if ( j !== numOptions-1 ) {
                                                var min = Math.round(addUpTo/numOptions * 0.8);
                                                var max = Math.round(addUpTo/numOptions * 1.2);
                                                randomN = randombetween(min, max);
                                            }
                                            else {
                                                randomN = addUpTo - currenTotal
                                                if (randomN < 0) randomN = 0;
                                            }
                                            
                                            // generate a random number for each entry
                                            // on the last entry make sure that the total adds up to 100
                                            currenTotal += randomN
                                            remaining -= randomN
                                            
                                            realTextFakeNumbers[questionID][optionIdentifier] =  randomN;
                                        }
                                    }
                                }
                                
                                if ( !$.isEmptyObject(realTextFakeNumbers) ) {
                                    jQuery.extend(true, page.fakeAnalytics, page.answers, realTextFakeNumbers);
                                }
                                analyticsData = jQuery.extend(true, {}, page.fakeAnalytics);
                                isPlaceholder = true;
                            }
                        }
                        else {
                            // if there is analytics data use that
                            analyticsData = jQuery.extend(true, {}, page.answers);
                        }
                        
                        var graphs = [ ];
                        
                        // var questionIndex = 0; // number of the question we are looping (for likert and multiple response) - we need this because in case there are multiple questions we only show results for the first one
                        
                        for(var questionID in analyticsData) {
                            // this loop organizes the data that will be used to generated the graphs
                            
                            // loop the questions in the analyticsData
                            // questionID = each question in the page analytics data
                            if(analyticsData.hasOwnProperty(questionID)) {
                                var analyticsQuestionData = analyticsData[questionID];
                                var opts = {
                                    labels: [],
                                    data: []
                                };
                                
                                for(var label in analyticsQuestionData) {
                                    // loop the answers inside the question that we are looping
                                    if(analyticsQuestionData.hasOwnProperty(label)) {
                                        
                                        var numPeopleChoseThisOption = parseInt(analyticsQuestionData[label]); // number of people that chose this answer
                                        opts.data.push(numPeopleChoseThisOption);
                                        opts.labels.push(label.split('[:]')[1]);
                                        
                                        // if (questionIndex === 0) {
                                        //     // only add up the number of people that answered the first question
                                        //     // because that clip only shows results for the first question
                                        //     total += numPeopleChoseThisOption;
                                        // }
                                    }
                                }
                                // questionIndex++;
                                graphs.push(opts);
                            }
                        }
                        
                        for( var k = 0; k<page.answer.length; k++ ) {
                            // what this loop does
                            // loop through all the answered questions on the page until we find the question with the ID that we are looking for
                            // loop all the answers selected for this question found
                            // loop the analytics data until we find data for the question we want
                            // loop through that question until we find the answer that matches the ID of the selected answer
                            
                            var questionIndex = k;
                            
                            // if question_id was set by the author look for that question, else display the first one
                            var questionID = question_id ? question_id : page.answer[0].interaction_id;
                            
                            // CHECKPOINT - only continue if interaction_id matches questionID
                            if(page.answer[questionIndex].interaction_id === questionID) {
                                
                                // loop through the chosen answers (usually there is only one answer but it can be multiple choice)
                                var selectedAnswers = page.answer[questionIndex].answer;
                                
                                for( var l = 0; l<selectedAnswers.length; l++ ) {
                                    
                                    var answerIndex = l;
                                    var selectedAnswerId = selectedAnswers[answerIndex].toString();
                                    
                                    if(selectedAnswerId) {
                                        
                                        if ( selectedAnswerId.indexOf('[:]') !== -1 ) {
                                            // this bit is simply to have it working on local since the object keys look different in local and live
                                            // on local => p163b11a0e45-answer-1
                                            // on live  => p163b11a0e45-answer-1[:]Answer Text
                                            selectedAnswerId = selectedAnswerId.split('[:]')[0];
                                        }
                                        
                                        // loop the questions in the analytics
                                        // until we find the answer whose id matches the the one that the user selected
                                        if(analyticsData.hasOwnProperty(questionID)) {
                                            var analyticsQuestionData = analyticsData[questionID];
                                            
                                            for(var answerKey in analyticsQuestionData) {
                                                if(analyticsQuestionData.hasOwnProperty(answerKey)) {
                                                    
                                                    var numPeopleChoseThisOption = parseInt(analyticsQuestionData[answerKey]); // number of people that chose this answer
                                                    total += numPeopleChoseThisOption;
                                                    
                                                    var answerId = answerKey.split('[:]')[0];
                                                    if ( answerId === selectedAnswerId ) {
                                                        if (same_as_you) continue; // only record the first match
                                                        same_as_you = numPeopleChoseThisOption;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if ( same_as_you ) { break; } // only record the first match
                                }
                                
                            }
                        }
                    } 
                }

                if ($this.hasClass('score')) {
                    if (isNumber(page.score)) 
                        $this.text( Math.round( page.score * 100 ) + '%' );
                    else
                        $this.text( '0%' );

                } else if ($this.hasClass('score_raw')) {
                    if (isNumber(page.score)) 
                        $this.text( Math.round( page.score * page.weighting ) );
                    else
                        $this.text( '0' );

                } else if ($this.hasClass('same_as_you_number')) {
                    $this.text(same_as_you);

                } else if ($this.hasClass('total')) {
                    $this.text(total);

                } else if ($this.hasClass('same_as_you_percentage')) {
                    if (total && same_as_you) {
                        $this.text( Math.round( 100 / total * same_as_you ) + '%' );//.toFixed(1)
                    } else {
                        $this.text( '0%' );
                    }

                } else if ($this.hasClass('how_you_answered')) {
                    //if (how_you_answered)
                        $this.text( howYouAnswered($this.attr('id')));

                } else if ($('html').hasClass('ie-lt9')) {
                    return; //Don't attempt to show graphs on IE8...
                }

                if($this.hasClass('chart') && graphs !== undefined) {
                    $this.empty();
                    $this.graph_build(graphs, isPlaceholder);
                }
            });
        },
        
        graph_build: function(graphs, isPlaceholder) {
            var swatches = [];
            var $parent = $(this).parent();
            function colorSwatches () {
                
                // create a temporary span to extract the colours from the colorways
                for (var i = 1; i <= 18; i++) {
                    var $swatch = $('<span class="graphSwatch graphSwatch--' + i + '"></span>');                    
                    $parent.append($swatch);
                    var swatch_color = $swatch.css('background-color');
                    $swatch.remove();
                    
                    // only add the colour to the swatches if it is not transparent
                    if (swatch_color !== 'rgba(0, 0, 0, 0)' && swatch_color !== 'transparent') {
                        swatches.push(swatch_color)
                    }
                }
                return swatches;
            }
            
            return this.each(function() {
                var $this = $(this);

                for(var i = 0; i<graphs.length; i++) {

                    var options = graphs[i];
                    // console.log('options',options);
                    // and populate colors, if we have it
                    if ($this.attr('data-colors'))
                        options.colors = $this.attr('data-colors').replace(/[^a-f0-9#\,]/gi, '').split(',');
                    
                    else {
                        options.colors = colorSwatches();
                        
                        if (!options.colors.length) {
                            options.colors = [ "#69D2E7","#E0E4CC","#F38630", "#C7604C", "#21323D", "#9D9B7F", "#7D4F6D", "#584A5E" ];
                        }
                    }
                    
                    // chart of results
                    var chart_id = $this.attr('id') + '__chart';
                    // inside the div - create a canvas (taking the width and height from the object)
                    var $canvas = $('<canvas id="' + chart_id + '"></canvas>');

                    $this.append($canvas);

                    if ($canvas.width()) {
                        $canvas.attr('width', $canvas.width());
                    }
                    if ($canvas.height()) {
                        $canvas.attr('height', $canvas.height());
                    }

                    // Capturing window variable with try catch as some LMSs will prevent us accessing top due to CORS
                    function detectIfPreview() {
                        try {
                            return Boolean(top.window.ElucidatApp);
                        } catch (error) {
                            console.error(error);
                            return false;
                        }
                    }

                    // ElucidatApp is a global variable only present in the authoring app so we are using it to differentiate between preview and release 
                    var isPreview = detectIfPreview();


                

                    var isReview = typeof getMode !== "undefined" && getMode() === REVIEW_MODE;

                    var ammountOfData = options.data.reduce(function (accumulator, a) {
                        return accumulator + a;
                    }, 0);
                    var isMeaningfulAmmountOfData = ammountOfData > 0;

                    if (isPreview || isReview) {
                        $parent.find('.chart__overlay--preview').show();
                    } else {
                        // If we're in a release
                        // and currently we are showing placeholder values we show the overlay and do not do any of the other chart functionality
                        if (isPlaceholder || !isMeaningfulAmmountOfData) {
                            /// There is an edge case currently where if you are the first person into a course, and you answer a question that is linked to a poll (chart)
                            // if you close the course and reopen very quickly, the bookmarking data won't have updated to include your answer and you won't be shown a placeholder
                            // this means you see the graph, but that all of the values will be 0, with the following 
                            $parent.find('.chart__overlay--release').show();  
                        }
                    }

                    // now we'll attempt to get the chart options
                    var graph_style = check_graph_style( $this );
                    // console.log(graph_style)
                    
                    var chart_options = {
                        responsive: graph_style.graph_is_responsive,
                        scaleFontColor: graph_style.graph_font_color,
                        scaleFontSize: graph_style.graph_font_size,
                        scaleFontFamily: graph_style.graph_font_family,
                        tooltipFontSize: graph_style.graph_font_size,
                        tooltipTitleFontFamily: graph_style.graph_font_family,
                        tooltipCaretSize: 4,
                        maintainAspectRatio: false,
                        animationEasing: "easeOutQuad",
                        animationSteps: 60
                    };
                    
                    // console.log(chart_options)
                    if ($this.attr('data-options')) {
                        try {
                            chart_options = JSON.parse($this.attr('data-options').replace(/\'/g, '"'));
                        } catch (e) {
                            console.log(chart_id + ': data-options seems to be invalid json');
                        }
                    }

                    var chart_defaults = {
                    };

                    var ctx = $canvas.get(0).getContext("2d");


                    if ($this.hasClass('line')) {
                        chart_defaults = {
                            pointDot: false,
                            datasetStroke: false,
                            maintainAspectRatio: false
                        };
                        chart_options = $.extend(chart_defaults, chart_options);
                        new Chart(ctx).Line(populateBar(options), chart_options);


                    } else if ($this.hasClass('bar')) {
                        chart_defaults = {
                            barShowStroke: false,
                            maintainAspectRatio: false
                        };
                        chart_options = $.extend(chart_defaults, chart_options);
                        new Chart(ctx).Bar(populateBar(options), chart_options);

                    } else if ($this.hasClass('radar')) {
                        chart_defaults = {
                            pointDot: false
                        };
                        chart_options = $.extend(chart_defaults, chart_options);
                        new Chart(ctx).Radar(populateBar(options), chart_options);
                        $this.append(makeLabels(options));

                    } else if ($this.hasClass('polar')) {
                        chart_defaults = {
                            segmentShowStroke: false
                        };
                        chart_options = $.extend(chart_defaults, chart_options);
                        new Chart(ctx).PolarArea(populatePie(options), chart_options);
                        $this.append(makeLabels(options));

                    } else if ($this.hasClass('pie')) {
                        chart_defaults = {
                            segmentShowStroke: false
                        };
                        chart_options = $.extend(chart_defaults, chart_options);
                        new Chart(ctx).Pie(populatePie(options), chart_options);
                        $this.append(makeLabels(options));
                    } else if ($this.hasClass('doughnut')) {
                        chart_defaults = {
                            segmentShowStroke: false
                        };
                        chart_options = $.extend(chart_defaults, chart_options);
                        new Chart(ctx).Doughnut(populatePie(options), chart_options);
                        $this.append(makeLabels(options));

                    }
                }
                
            });
        }
    });
        
})(jQuery);

(function($){

    var form_item_id = 0;

    $.fn.extend({
        form_input: function(options) {
        
            //Settings list and the default values
            var defaults = {};
            
            var options = $.extend(defaults, options);
            
            return this.each(function() {
                // find the html, which should be json
                var $item = $(this);
                var field_object = $item.html().split(':');
                var $form = $item.parents('form');
                
                if ((field_object[0] == 'checkbox' || field_object[0] == 'radio') && field_object[1]) {
                    var name = field_object[1].replace('~[^a-z0-9\_\-]~gi','');
                    if (name) {
                        // make a unique form id for radio buttons
                        form_item_id++;
                        var id = 'field_'+form_item_id;

                        //Radio's names should not be unique, whereas checkboxes should.
                        if(field_object[0] === 'radio') {
                            name = name.split('-')[0];
                            
                            if ( $form.hasClass('likert') ) {
                                var question_number = $item.parents('fieldset').index();
                                name = name+'-'+question_number;
                            }
                            else if ( $form.hasClass('multiple_response') ) {
                                var question_number = $item.parents('tr').index();
                                name = name+'-'+question_number;
                            }
                        }

                        $item.html('<input type="'+field_object[0]+'" name="'+name+'" id="'+id+'" />');
                        
                        // now find the closest label, and tag the two together
                        var $label;
                        // look to the brothers
                        $label = $item.siblings('label').first();
                        
                        // now cousins
                        if (!$label.length)
                            $label = $item.parent().parent().find('label').first();
                        // and now 2nd cousins 
                        if (!$label.length)
                            $label = $item.parent().parent().parent().find('label').first();

                        if ($label.length)
                            $label.attr('for', id);
                        
                    }
                }
                $(this).show();
            });
        }   
    });
        
})(jQuery);
(function($){


    $.fn.extend({
        ie8poly_bg_size: function() {

            return this.each(function() {

                var $this = $(this);
                var bgSize = ie8bg.getBgSize($this[0]);

                // If the element doesnt have background-size then go away.
                if(!bgSize || bgSize === 'auto') {
                    return;
                }

                var elOuterHeight = $this.outerHeight();
                var elOuterWidth = $this.outerWidth();
                var elHeight = $this.height();

                //Set element to be relative so we can position stuff within it.
                if($this.css('position') === 'static') {
                    $this.css({'position' : 'relative'});
                }

                var bgImg, $elBgImg, $elBgContainer, $elContentContainer,$elContentSpacer;

                //We set this later to prevent creating more nested elements every time this is run.
                if(!$this.data('bg-size-done')) {

                    var bgImageUrl = ie8bg.getImagePath($this.css('background-image'));
                    if(!bgImageUrl) {
                        return;
                    }

                    bgImg = new Image();

                    bgImg.onload = function() {
                        onloadBgImg($this);
                    };
                    //Make a new image element with src the same as the background.
                    bgImg.src = bgImageUrl;

                } else {
                    onloadBgImg($this);
                }

                function onloadBgImg($this) {
                    if(!$this.data('bg-size-done')) {

                        $this.data('imgWidth',bgImg.width);
                        $this.data('imgHeight', bgImg.height);
                        $elBgImg = $(bgImg);
                        $elBgContainer = $('<div class="e-poly-bg-container"/>'); //Will contain the background image
                        $elContentContainer = $('<div class="e-poly-content-container" />'); //will contain whatever the original div contained.
                        $elContentSpacer = $('<div class="e-poly-spacer" />');

                        // Wrap existing content in a container so it
                        // can sit on top of the bg image.
                        $elContentContainer
                            .html($this.html());

                        // style the background image container, the bg image will sit inside it.
                        $elBgContainer.css({
                            'position': 'absolute',
                            'top': 0,
                            'bottom': 0,
                            'left': 0,
                            'right':0,
                            'overflow': 'hidden'
                        });

                        if(ie8bg.debug) {
                            $elBgContainer.css({
                                'background-color': 'rgb(255,0,0)'
                            });
                        }

                        $elBgImg.css({
                            'position': 'absolute'
                        });

                        //replace the content of the element with the wrapped content.
                        $this.html($elContentContainer);
                    } else {

                        $elBgContainer = $('> .e-poly-bg-container', $this); //Will contain the background image
                        $elContentContainer = $('> .e-poly-content-container', $this);
                        $elBgImg = $('img', $elBgContainer);
                        $elContentSpacer = $('> .e-poly-spacer', $this);
                        //bgImg = $elBgImg.get(0);
                        // imgWidth = bgImg.width;
                        // imgHeight = bgImg.height;

                    }

                    $elContentContainer
                        .css({
                            'position': 'absolute',
                            'top' : 0,
                            'bottom' : 0,
                            'left' : 0,
                            'right' : 0,
                            // 'height' : elHeight,
                            'padding': $this.css('padding')
                        });

                    // console.log('1 ####### ' + $elContentContainer.children().first().height() + ' or ' + elHeight);
                    $elContentSpacer
                        .css({
                            'height': $elContentContainer.children().first().height() || elHeight
                        });

                    // Depending on the value of the background-size property we need to position the
                    // new inner image differently.
                    var size;
                    switch(bgSize) {
                        case 'cover':
                            size = ie8bg.calculateAspectRatioCover($this.data('imgWidth'),$this.data('imgHeight'),elOuterWidth,elOuterHeight);
                            $elBgImg.css({
                                'width': size.width,
                                'height': size.height
                            });

                            break;

                        case 'contain':
                            size = ie8bg.calculateAspectRatioContain($this.data('imgWidth'),$this.data('imgHeight'),elOuterWidth,elOuterHeight);
                            $elBgImg.css({
                                'width': size.width,
                                'height': size.height
                            });

                            break;

                        default:
                            var sizeArray = bgSize.split(' ');

                            $elBgImg.css({
                                'width': sizeArray[0],
                                'height': sizeArray[1]
                            });

                            break;
                    }

                    if(!$this.data('bg-size-done')) {

                        //Let's not make all these elements twice!
                        $this.data('bg-size-done', true);

                        // Put the image in the container.
                        $elBgContainer.prepend($elBgImg);

                        // Prevent the background image showing behind the emulated bg image.
                        $this.css({
                            'background-image' :'none'
                        });

                        // Put the container and spacer in the original elem.
                        $this
                            .prepend($elBgContainer)
                            .prepend($elContentSpacer);
                    }

                    //This next bit relies on getting the size of the element so sadly we have
                    // to do these last few bits after the el has been added to the dom.
                    var pos = ie8bg.getBgPos($this[0]);

                    var marginLeft = 0,
                        marginTop = 0;

                    //CSS positions the background with the center of the image as the origin.
                    //Using negative margin to offset the image.

                    if(pos.x.indexOf('%')!==-1 && pos.x !== '0%') {
                        //Margin left needs to be negative pos.x % of the width of the image.
                        marginLeft = 0-($elBgImg.width()*(parseFloat(pos.x)/100))
                    }

                    if(pos.y.indexOf('%')!== -1 && pos.y !== '0%') {
                        //Margin top needs to be negative pos.y % of the height of the image.
                        marginTop = 0-($elBgImg.height()*(parseFloat(pos.y)/100))
                    }

                    $elBgImg.css({
                        'left': pos.x,
                        'top': pos.y,
                        'margin-left': marginLeft,
                        'margin-top': marginTop
                    });

                }

            });
        }
    });

})(jQuery);

var IE8_Bgsize = function (  ) {
    this.elems = [];
    this.debug = false;
};

IE8_Bgsize.prototype.getElems = function() {
    return $(this.elems);
};

IE8_Bgsize.prototype.updateElems = function() {
    if(this.debug || this.isIE()) {
        var allElemsOnPage = document.body.getElementsByTagName("*");
        for (var i = allElemsOnPage.length; i--;) {
            var loopedElem = allElemsOnPage[i];
            //Add all elems with background-size property that have not been polyfilled already.
            if(this.getBgSize(loopedElem)) {
                if(!$(loopedElem).data('bg-size-done')) {
                    this.elems.push(loopedElem);
                }
            }
        }
    }
    return this;
};


//IE8 hack to get background-size.
IE8_Bgsize.prototype.getBgSize = function(elem) {
    if(!this.debug || this.isIE()) {
        return  elem.style['background-size'] || elem.currentStyle['background-size'] || elem.style.getAttribute('backgroundSize') || elem.currentStyle.getAttribute('backgroundSize');
    } else {
        //if not IE, we can just use jQuery like a normal person. (should only be here if debugging).
        var bgSizeprop = $(elem).css('background-size');
        return bgSizeprop === 'auto' ? false : bgSizeprop;
    }
};

//IE8 hack to get background-position - 'elem' must be native dom elem, not jquery object.
IE8_Bgsize.prototype.getBgPos = function(elem) {
    if(!this.debug || this.isIE()) {
        var x = elem.style['background-position-x'] ||
            elem.currentStyle['background-position-x'] ||
            elem.style.getAttribute('backgroundPositionX') ||
            elem.currentStyle.getAttribute('backgroundPositionX');
        var y = elem.style['background-position-y'] ||
            elem.currentStyle['background-position-y'] ||
            elem.style.getAttribute('backgroundPositionY') ||
            elem.currentStyle.getAttribute('backgroundPositionY');
        return {x:x, y:y}
    }
    //if not IE (should really only be here if debugging.
    return {x:$(elem).css('background-position-x'), y: $(elem).css('background-position-y')};
};

IE8_Bgsize.prototype.isIE = function() {
    return $('html').hasClass('no-backgroundsize');
};

IE8_Bgsize.prototype.getImagePath = function(bgCssValue) {
    //Take string like url('http://google.com') and remove all but the actual url.

    var url = bgCssValue.match(/^url\("?(.+?)"?\)$/);
    if(ie8bg.debug) {
        var dt = new Date();
        return url[1] + '?' + dt.getTime();
    }
    if(url && url.length > 1) {
        return url[1];
    }
    return false;
};

IE8_Bgsize.prototype.calculateAspectRatioCover = function(srcWidth, srcHeight, maxWidth, maxHeight) {
    var ratio = Math.max(maxWidth / srcWidth, maxHeight / srcHeight);

    return { width: srcWidth*ratio, height: srcHeight*ratio };
};

IE8_Bgsize.prototype.calculateAspectRatioContain = function(srcWidth, srcHeight, maxWidth, maxHeight) {
    var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);

    return { width: srcWidth*ratio, height: srcHeight*ratio };
};

var ie8bg = new IE8_Bgsize();

// EXAMPLE
// $(document).ready(function() {
//
//     //Only do stuff in IE (or if debuggin').
//     if(!ie8bg.debug && !ie8bg.isIE() && !ie8bg.isBadIE()) {
//     } else {
//         ie8bg.updateElems().getElems().ie8poly_bg_size();
//     //
//     //     // IRL you'd wanna debounce this.
//         $(window)
//             .resize(function() {
//                 ie8bg.updateElems().getElems().ie8poly_bg_size();
//             })
//     }
// //
// });
(function($){

    $.fn.extend({
        input_slider: function(input_options) {
            var options = $.extend({}, $.fn.audio.defaults, input_options);

            return this.each(function() {
                // make a slider, with values equivalent to the .answers that are it's siblings
                // find all of the sibling answers
                var $this = $(this);
                
                var $answers = $this.siblings('.answer');
                // if no answers - also check the parent
                if (!$answers.length)
                    $answers = $this.parent().find('.answer');

                if ($answers.length) {
                    var answers = [];
                    var selected = 0;
                    
                    var orientation = $this.attr('data-orientation') ? $this.attr('data-orientation') : 'horizontal';
                    
                    var direction = 'ltr';
                    
                    if ( $this.attr('data-mode') ) {
                        direction = $this.attr('data-mode');
                    }
                    else if (document.dir === 'rtl' || $('html').attr('dir') === 'rtl' || $('body').attr('dir') === 'rtl' || $this.closest('#__body__moved').attr('dir') === 'rtl') {
                        direction = 'rtl';
                    }
                    

                    $answers.each(function (i) {
                        var $a = $(this);
                        answers.push($a);
                        if ($a.find('input').get(0).checked)
                            selected = i;
                        // save number for later
                        $a.data('position', i);
                        // and put a score on each item
                        var score = 1 - (1 / ($answers.length-1) * i);
                        // var score = 1 / ($answers.length-1) * i;
                        // if (direction != 'rtl')
                        //     score = 1 - score;
                        $a.data('score', score);
                    });
                    // make sure first answer is selected (because a slider always has something selected)
                    if (!selected) {
                        // if (direction == 'rtl') {
                        //     answers[ answers.length - 1 ].addClass('selected').find('input').get(0).checked = true;
                        // } else {
                            answers[0].addClass('selected').find('input').get(0).checked = true;
                        // }
                    }
                    var start_val = selected;
                    if (orientation == 'vertical' || direction == 'rtl') {
                        start_val = answers.length - 1 - start_val;
                    }
                    // make sure change event is not fired if change comes from the input event
                    var change_is_from_input = false;
                    // init the slider
                    
                    // calculate the width of the slider based on the number of answers
                    $this.css('width', (100/(answers.length)) * ((answers.length)-1) + '%');
                    
                    $this.addClass('e-slider-items-'+(answers.length)).slider({
                        min: 0,
                        max: answers.length - 1,
                        value: start_val,
                        step: 1,
                        range: direction === 'rtl' ? 'max' : 'min',
                        orientation: orientation,
                        start: function () {
                            // disable gestures when sliding
                            $('#pew').gestures("disable");
                        },
                        stop: function () {
                            // disable gestures when sliding
                            $('#pew').gestures("enable");
                        },
                        change: function (event, ui) {
                            // do not do change event
                            if (!change_is_from_input) {
                                // move event target 
                                $answers.each(function() {
                                    $(this).removeClass('selected').find('input').prop('checked', false);
                                });

                                var chosen = ui.value;
                                if ( orientation == 'vertical' || direction ==='rtl' ) {
                                    chosen = answers.length - 1 - chosen;
                                }

                                // find the answer with that key, and click the 
                                answers [ chosen ].addClass('selected').find('input').prop('checked', true);

                                // and add a styling class
                                var $form = $answers.parents('form');
                                $form.addClass('answered');
                                
                                // find save button to make sure it is enabled
                                var $save_button = $form.find('a.save_button, button.save_button');
                                $save_button.attr('disabled', false);
                            }
                        }
                    });

                    $answers.on('selected',function (e) {
                        var position = parseInt($(e.target).data('position'));
                        if ( orientation == 'vertical' || direction === 'rtl' ) {
                            position = answers.length - 1 - position;
                        }
                            
                        // stop event telling input to change
                        change_is_from_input = true;
                        $this.slider('value', position);
                        change_is_from_input = false;
                    
                    }).on('unselected',function (e) {
                        // likerts always a selected. so reselect
                        $(this).addClass('selected').find('input').get(0).checked = true;
                    });
                }
            });
        }   
    });

    //Settings list and the default values
    $.fn.input_slider.defaults = {};
        
})(jQuery);


(function($){
    var inputs = {};
    //
    $.fn.extend({
        learner_input: function( preentered_options ) {
            // save initial values
            inputs = preentered_options;
            // 
            return this.each(function() {
                // each input gets registered
                // when it changes, the variable gets changed
                // then the blockquotes live update
                var $input = $(this);
                // set the initial value
                $input.val( inputs[ $input.attr('name') ] );
                // 
                $input.change(function () {
                    // strip any dodginess
                    var $val = $('<div></div>');
                        $val.html( $input.val() );
                    // store the input
                    var attr_name = $input.attr('name');
                    inputs[attr_name] = $val.text();
                    // change any blockquotes to match
                    $('span.learner_input[data-input="'+attr_name+'"]').text( inputs[ attr_name ] );
                    // now fire off to the LRS to save
                    $input.trigger('elucidat.learner.input', [ attr_name, inputs[ attr_name ] ] );
                });
            });
        },
        learner_output: function() {
            return this.each(function() {
                // cache
                var $this = $(this);
                // change any blockquotes to match
                $this.text( inputs[ $this.attr('data-input') ] );
            });
        }  
    });
        
})(jQuery);

(function($){
    var score_total = 0;

    function decimalPlaces(num) {
        var match = (''+num).match(/(?:\.(\d+))/);
        if (!match) {
            return 0;
        }
        return Math.max(
            0,
            // Number of digits right of decimal point.
            (match[1] ? match[1].length : 0)
        );
    }
    
    $.fn.extend({
        
        score_summary: function(options) {
            //Settings list and the default values
            var defaults = {
            };
            
            options = $.extend(defaults, options);
            
            return this.each(function() {
                // define needed variables
                var $this = $(this);
                var page_code, page_data;
                
                // find the table
                var $summary_table = $this.find('.scoreSummary__table');
                
                // // build the table head
                // var table_head = $summary_table.find('.scoreSummary__head');
                // var $thead = $('<thead></thead>');
                // 
                // table_head.remove();
                // $summary_table.prepend($thead);
                // $thead.append(table_head);
                
                var $table_footer = $summary_table.find('.scoreSummary__footer');
                var $tfoot = $('<tfoot></tfoot>');
                
                $table_footer.remove();
                
                // build the table body
                var $tbody = $summary_table.find('tbody');
                // find the template rows
                var $chapter_row = $summary_table.find('.scoreSummary__row--chapter');
                var $question_row = $summary_table.find('.scoreSummary__row--question');
                
                // define the template rows
                var $chapter_row_template = $($chapter_row);
                var $question_row_template = $($question_row);
                
                // remove the template rows
                $chapter_row.remove();
                $question_row.remove();
                
                // total weightning will later be used convert the page weighting into percentage
                var total_weighting = 0;
                // loop through all pages of the course to calculate
                for (var i = 0; i < e.elucidat.page_order.length; i++ ) {
                    page_code = e.elucidat.page_order[i];
                    page_data = e.elucidat.pages[ page_code ];
                    
                    // if the page is not hidden, has a score and weighting
                    // add it's weighting to the total weighting in order to later convert it to a percentage
                    if (!page_data.hidden) {
                        if (page_data.has_score && page_data.weighting) {
                            total_weighting += page_data.weighting;
                        }
                    }
                }
                
                
                score_total = 0;
                
                // loop through all pages of the course
                for (var j = 0; j < e.elucidat.page_order.length; j++ ) {
                    page_code = e.elucidat.page_order[j];
                    page_data = e.elucidat.pages[ page_code ];
                    // console.log(page_data);
                    
                    if ( page_data.is_section && !page_data.hidden || page_data.has_score && !page_data.hidden) {
                        
                        // if the page reached is the start of a chapter add a chapter row
                        if ( page_data.is_section ) {
                            
                            // if it is a chapter look at it's children to see if any of them is scored
                            // if there are no scored children do not add a row for this chapter
                            var page_children = page_data.children;
                            
                            // only add the chapter if it is a scored page
                            // or if at least one of the children is a scored page
                            var add_this_chapter = false;
                            
                            if (page_data.has_score) {
                                // if the chapter start itself is scored then add it
                                add_this_chapter = true;
                            }
                            else if (page_children) {
                                // if the chapter start is not scored and it has children assume negative
                                var add_this_chapter = false;
                                
                                // check it's children to see if any of them is scored
                                for (var k = 0; k < page_children.length; k++ ) {
                                    var children_data = e.elucidat.pages[ page_children[k] ];
                                    
                                    if (children_data.has_score && !add_this_chapter) {
                                        //if any of the children is scored then add the chapter row
                                        add_this_chapter = true;
                                    }
                                }
                            }
                            
                            if (add_this_chapter) {
                                $chapter_row_template.build_chapter_row({
                                    page_data : page_data,
                                    page_code : page_code,
                                    summary_table : $summary_table
                                });
                            }
                        }
                        // if the page reached has a score add a row
                        if ( page_data.has_score) {                            
                            $question_row_template.build_question_row({
                                page_data : page_data,
                                total_weighting : total_weighting,
                                summary_table : $summary_table
                            });
                        }
                    }
                }
                
                $summary_table.append($tfoot);
                $tfoot.append($table_footer);
                var $totalScore = $table_footer.find('.totalScore');
                var find_bold = $totalScore.find('strong');
                
                $totalScore.text(Math.round(score_total));
                
                if ( find_bold ) {
                    $totalScore.wrap('<strong>')
                }
                
            });
        },
        build_chapter_row: function(options) {
            var defaults = {
                page_data : null,
                page_code : null,
                summary_table : null
            };
            
            options = $.extend(defaults, options);
            
            return this.each(function() {
                var $template = $(this);
                var page_data = options.page_data;
                var page_code = options.page_code;
                var $summary_table = options.summary_table;
                
                // clone the template
                var $row = $template.clone();
                
                // add content to the row
                // add title
                var $row_title = $row.find('.scoreSummary__chapterTitle');
                var $row_title_text =  $row_title.find('.text');
                $row_title_text.text(page_data.name);
                
                // add link
                var $row_link = $row.find('.e-chapter-link');
                $row_link.attr({'href': '{{navigation.'+page_code+'.url}}'})
                
                // append the row to the table
                $summary_table.append($row);
            });
        },
        build_question_row: function(options) {
            var defaults = {
                page_data : null,
                page_code : null,
                total_weighting : null,
                summary_table : null
            };
            
            options = $.extend(defaults, options);
            
            return this.each(function() {
                var $template = $(this);
                var page_data = options.page_data;
                var total_weighting = options.total_weighting;
                var $summary_table = options.summary_table;
                
                // find how many questions the page has
                // this is object is only created after visiting the page
                var $questions = page_data.answer;
                
                // $questions is only populated after the page is visited
                // if it doesn't exit yet assume there is one question on the page
                var questions_on_page = 1;
                
                if (!$questions || $questions.length == 0) {
                    questions_on_page = 1
                }
                else if ($questions.length) {
                    questions_on_page = $questions.length;
                }
                
                // loop through each question on the page
                // create a row for each question
                for (var l = 0; l < questions_on_page; l++) {
                    // find the question on the page
                    var questionN = 1 + l;
                    if ($questions) {
                        var $question = $questions[l];
                    }
                    // console.log('questions on page ' + questions_on_page)
                    
                    // clone the template
                    var $row = $template.clone();
                    
                    // add content to the row
                    // add title
                    var $row_title = $row.find('.scoreSummary__title');
                    var $row_title_text =  $row_title.find('.text');
                    $row_title_text.text(page_data.name);
                    
                    // if there is more than one question add a suffix to identify the question number
                    if ( questions_on_page > 1 ) {
                        var question_indentify = '<span> (Question ' + questionN + ')</span>'
                        $row_title_text.append(question_indentify);
                    }
                    
                    var $row_score = $row.find('.scoreSummary__score');
                    var $row_weighting = $row.find('.scoreSummary__weighting');
                    
                    // if the page has been visited use the question score instead of the page score
                    var $score = $question ? $question.score : page_data.score;
                    // console.log(score)
                    // add score
                    $row_score.check_row_score({
                        score: $score
                    });
                    // add weighting
                    $row_weighting.weight_calc({
                        total_weighting: total_weighting,
                        page_weighting: page_data.weighting,
                        questions_on_page: questions_on_page,
                        score: $score
                    });
                    
                    // append the row to the table
                    $summary_table.append($row);
                }
            });
        },
        
        check_row_score: function(options) {
            //Settings list and the default values
            var defaults = {
                score : null
            };
            
            options = $.extend(defaults, options);
            
            return this.each(function() {
                var score = options.score;
                var $score_cell = $(this);
                
                var $ti = $score_cell.find('.ti');
                var ti_class = 'ti ti-close';
                var result = 'e-answered-incorrect';
                var title = 'Incorrect';
                
                if (score == 1) {
                    ti_class = 'ti ti-check';
                    result = 'e-answered-correct';
                    title = 'Correct';
                }
                else if (score > 0) {
                    ti_class = 'ti ti-check';
                    result = 'e-answered-partially-correct';
                    title = 'Partially Correct';
                }
                else if ( score === null || score === false) {
                    ti_class = 'ti ti-minus';
                    result = 'e-not-answered';
                    title = 'Page not visited';
                }
                
                // append the result icon with the corresponding class
                $ti.attr('class','');
                $ti.addClass( ti_class ).attr('title', title);
                // add the result class to the parent row
                $score_cell.closest( 'tr' ).addClass( result );
            });
        },
        weight_calc: function(options) {
            //Settings list and the default values
            var defaults = {
                total_weighting: 0,
                page_weighting: 0,
                questions_on_page: 1,
                score: 0
            };
            options = $.extend(defaults, options);
            
            return this.each(function() {
                //define needed variables
                var $weight_cell = $(this);
                var total_weighting = options.total_weighting;
                var page_weighting = options.page_weighting;
                var questions_on_page = options.questions_on_page;
                var score = options.score;
                
                // calculate the weighting as a percentage
                var weight_percent = (100 / (total_weighting / page_weighting));
                // divide by the number of questions on the page
                weight_percent = weight_percent / questions_on_page;
                // multiple by the question score
                weight_percent = weight_percent * score;
                score_total = score_total + weight_percent;
                
                // console.log(weight_percent)
                // maximum 1 decimal
                
                $weight_cell.text( '' );
                if (weight_percent % 1 != 0) {

                    // maximum 2 decimal places
                    var decimal_places = decimalPlaces(weight_percent);
                    if (decimal_places > 2) {
                        decimal_places = 2;
                    }
                    // round to the number of decimal places
                    weight_percent = weight_percent.toFixed(decimal_places);
                    
                    
                    var split_num = weight_percent.split('.');
                    var intt = split_num[0];
                    var dec = split_num[1];
                    
                    $weight_cell.text( '' );
                    $weight_cell.append( intt + '.' + '<small>' + dec + '</small>' );
                }
                else {
                    $weight_cell.append( weight_percent );
                }
                
            });
        }
    });
})(jQuery);    
// Make a global function to close tooltips when a new page is opened. See PD-2597.
var hideAllTooltips;

(function($){
    var popovers = [];

    function tooltipIsShowing($element) {
        try {
            return $element.data('popover').tip().hasClass('in');
        } catch (error) {
            return false;
        }
    }

    hideAllTooltips = function () {
        for (var i = 0; i < popovers.length; i++) {
            try {
                var popover = popovers[i];
                // only clear popovers if they are shown - stops accessibility bugs
                if ( tooltipIsShowing(popover) ) {
                    popover.popover('hide');
                }
            } catch (error) {
                continue;
            }
        }
    }
    
    $.fn.extend({
        tooltip_extended: function( _options ) {
            var options;

            if (_options !== 'destroy' && _options !== 'destroy-this') {
                options = $.extend({}, _options);
            } else {
                options = _options;
            }

            return this.each(function () {
                var $linkOrButton = $(this);

                var isProgressTooltip = $linkOrButton.hasClass('disabled_button_tooltip') &&
                  $linkOrButton.data('showtooltip') === 1;

                // Only activate this for progress tooltips when the page settings actually block
                // navigating to the next page, otherwise they just show for a split second and then
                // when navigating back to the page can't be closed. Related to PD-2597.
                if (isProgressTooltip && !$linkOrButton.hasClass('button--disabled')) {
                    return;
                }

                var triggeredByClick = isProgressTooltip || options.trigger === 'click';

                function setPopoverPlacement (popover, trigger) {
                    try {
                        return trigger.getBoundingClientRect().top < window.innerHeight / 2 ? 'bottom' : 'top';
                    } catch (error) {
                        return false;
                    }
                }

                function addCloseButton (element) {
                    // Made this into a function as after destroying a tooltip and initialising
                    // a new one this needs to be rebuilt
                    var $close = $('<button type="button" class="close">&times;</button>');
                    element.prepend($close);
                    $close.click(function () {
                        if ($linkOrButton) {
                            $linkOrButton.popover('hide');
                        } else {
                            hideAllTooltips();
                        }
                    });
                }

                function popoverAlreadyExists ($el) {
                    var filter = popovers.filter(function (p) {
                        return p[0] === $el[0];
                    });
                    return filter.length > 0
                }

                if (options === 'destroy') {
                    // clear active popovers
                    for (var i = 0; i < popovers.length; i++) {
                        popovers[i].popover('destroy');
                    }

                    popovers = [];
                    $linkOrButton.find('.e-popover').each(function () {
                        $(this).stop().remove();
                    });
                } else if (options === 'destroy-this') {
                    // clear active popovers
                    $linkOrButton.popover('destroy');
                    popovers = popovers.filter(function($el) {
                        return $el[0] !== $linkOrButton[0];
                    });
                } else {

                    if (popoverAlreadyExists($linkOrButton)) {
                        // prevents the same element to be added multiple times
                        return;
                    }

                    // if has data-tooltip - it is a new style tooltip with title and text
                    if ($linkOrButton.attr('data-tooltip')) {
                        // If element is a tooltip that displays if the learner has or has not completed the page format the string data differently
                        var string_data = '';
                        
                        if ($linkOrButton.attr('data-showtooltip')) {
                            string_data = JSON.stringify({
                                text: $linkOrButton.attr('data-tooltip')
                            });
                        } else {
                            string_data = $linkOrButton
                                    .attr('data-tooltip')
                                    .replace(/&amp;/gi, '&')
                                    .replace(/&quot;/gi, '"')
                                    .replace(/&gt;/gi, '>')
                                    .replace(/&lt;/gi, '<');
                        }

                        var dataTooltip = $linkOrButton.attr("data-tooltip")
                        var json_data = null;
                        var string_data;
                        
                        try {
                            // If element is a tooltip that displays if the learner has or has not completed the page format the string data differently
                            if ($linkOrButton.attr("data-showtooltip")) {
                                string_data = JSON.stringify({
                                    text: dataTooltip
                                });
                            } else {
                                string_data = dataTooltip
                                    .replace(/&amp;/gi, "&")
                                    .replace(/&quot;/gi, '"')
                                    .replace(/&gt;/gi, ">")
                                    .replace(/&lt;/gi, "<");
                            }
                            json_data = JSON.parse(string_data);
                        } catch (error) {
                            // Abort if the tooltip data can't be parsed
                            console.error('corrupted tooltip')
                            return;
                        }

                        if (isProgressTooltip) {
                            var left = $(this).offset().left
                            $.fn.right = function() {
                                return $(document).width() - (this.offset().left + this.outerWidth());
                            }
                            var progressTooltipPosition = left > $(this).right() ? "left" : "right";
                        }

                        var popoverOptions = {
                            trigger: 'manual',
                            html: true,
                            placement: setPopoverPlacement,
                            content: json_data.text,
                            title: json_data.title || '',
                            container: $linkOrButton.closest('#pew')
                        };

                        $linkOrButton.popover(popoverOptions);

                        $linkOrButton.on('click', function (e) {
                            e.stopPropagation();
                            e.preventDefault();

                            if ($linkOrButton.closest('.mce-edit-focus').length) {
                                // do not trigger tooltips if tinymce editor is active
                                // as it makes authoring more dificult
                                return;
                            }

                            if (!$linkOrButton.data('showtooltip')) {
                                return;
                            }

                            if (triggeredByClick && !tooltipIsShowing($linkOrButton)) {
                                // hideAllTooltips();
                                $linkOrButton.popover('show');
                            }
                        });

                        $linkOrButton.on('mouseover focus', function () {
                            if ($linkOrButton.closest('.mce-edit-focus').length) {
                                // do not trigger tooltips if tinymce editor is active
                                // as it makes authoring more dificult
                                return;
                            }
                            if (tooltipIsShowing($linkOrButton)) {
                                // if this tooltip is already showing then do nothing
                                return;
                            }
                            if (triggeredByClick) {
                                // stop if it is a tooltip that displays if the learner has or has not completed the page
                                return;
                            }

                            // if the popover is not already open...
                            hideAllTooltips();
                            $linkOrButton.popover('show');
                        });
                        

                        if ($linkOrButton.hasClass('nextButton')) {
                            // hide the arrow on the next button since it is too close to the edge
                            $linkOrButton.data('popover').tip().addClass('hidePopoverArrow');
                        }

                        // get the poover object
                        var $popover = $linkOrButton.data('popover').tip();
                        
                        addCloseButton($popover);
                        $popover.addClass('e-popover');
                        $popover.click(function(event) {
                            event.stopPropagation();
                        });

                        // store list of active ones
                        popovers.push($linkOrButton);

                        if (triggeredByClick) {
                            setTimeout(function() {
                                // needs a small timeout otherwise the tooltip closes right after showing
                                $linkOrButton.popover('show');
                            }, 10);
                        }

                    // otherwise it will be a title (old style one)
                    } else {
                        // is bootstrap default - so let it go
                        $linkOrButton.tooltip();
                    }
                }
            });
        }
    });

    document.addEventListener('click', function(event) {
        // hide all tooltips when clicking somewhere else on the page
        // or showing new elements
        hideAllTooltips();
    });
})(jQuery);
$( document ).ready(function() {
  $.fn.extend({
    add_lang_attr: function() {

      var $selectedLanguage;
      
      try {
        $selectedLanguage = e.elucidat.options.localisation.language.ietf;
      } catch (error) {
        $selectedLanguage = false;
      }

      if ($selectedLanguage === 'de') {
        $(".cookie-policy_english").remove();
      } else {
        $(".cookie-policy_german").remove();
      }

      return this.each(function(){
        var $this = $(this);
        if ($selectedLanguage) {
          $this.attr("lang", $selectedLanguage);
        }
      });
    }
  })
});
Array.prototype.average=function(){
    var sum=0;
    var j=0;
    for(var i=0;i<this.length;i++){
        if(isFinite(this[i])){
          sum=sum+parseFloat(this[i]);
           j++;
        }
    }
    if(j===0){
        return 0;
    }else{
        return sum/j;
    }

}
Array.prototype.shuffle=function(){
	var o=this.slice();
	for(var j,x,i=o.length;i;j=parseInt(Math.random()*i),x=o[--i],o[i]=o[j],o[j]=x){};
	return o;
};
(function($){

    var $header = null, $footer = null, $pawWrapper = null, $backgroundWrapperEdit = null;

    $.fn.extend({
        calc_fixed_header_size: function (updateSelectors) {

            return this.each(function() {

                var $pew = $(this);

                // In the editor, top padding should be added to .background__wrapper so edit button doesn't sit under header.
                // In this case, it should not be added to pawWrapper else the top padding will be doubled up.

                if ($header === null || !$header.length || updateSelectors) {
                    $header = $('.project__header', $pew);
                    $header.data('fixed-header-height', 0);
                }
                if ($footer === null || !$footer.length || updateSelectors) {
                    $footer = $('.project__footer', $pew);
                }
                if ($backgroundWrapperEdit === null || !$backgroundWrapperEdit.length || updateSelectors) {
                    $backgroundWrapperEdit = $('.background__wrapper > .e-edit-toggle', $pew);
                }
                if ($pawWrapper === null || !$pawWrapper.length || updateSelectors) {
                    $pawWrapper = $('.e-contains-paw', $pew);
                    
                    if ($pawWrapper === null || !$pawWrapper.length || updateSelectors) {
                        $pawWrapper = $('.template_wrapper_outer', $pew);
                    }
                }

                if ($header.hasClass('e-pos--fixed') && $header.is(':visible')) {
                    $pawWrapper.css('padding-top', $header.height());
                    $header.data('fixed-header-height', $header.height());
                } else {
                    $pawWrapper.css('padding-top', 0);
                }

                if (($footer.hasClass('e-pos--fixed') || $footer.hasClass('e-pos--bottom')) && $footer.is(':visible')) {
                    $pawWrapper.css('padding-bottom', $footer.height());
                } else {
                    $pawWrapper.css('padding-bottom', 0);
                }

                // The edit button on the background wrapper will sit under the header if we dont bump it down to sit underneath it.
                if ($backgroundWrapperEdit.length) {
                    $backgroundWrapperEdit.each(function() {
                        this.style.setProperty('top', $header.height() + 'px', 'important');
                    });
                }

            });

        }
    });


})(jQuery);
function getInPreview() {
    try {
        return window.location.origin === window.urls.preview;
    } catch (e) {
        return false;
    }
}function getMode() {
    var params = new URLSearchParams(
        window.location.search
    );

    return params.has('mode') ?
        params.get('mode') :
        null;
}

var REVIEW_MODE = 'review';function getShouldDisableTimer() {
    // Check whether we're in review mode
    var inReviewMode = getMode() === REVIEW_MODE;

    // Check whether we're in preview
    var inPreview = getInPreview();

    // We only want no timer if we're
    // in preview and review mode
    return (
        inPreview && inReviewMode
    );
}function getShouldIgnoreNavigationRules() {
    // Check whether we're in review mode
    var isReviewMode = getMode() === REVIEW_MODE;

    // Check whether we're in preview
    var inPreview = getInPreview();

    // We can ignore nav rules if we're
    // in review mode and preview
    return isReviewMode && inPreview;
}function getCurrentScore(pages){
    //this takes the e.elucidat.pages object and returns the current score
    var total_score = 0;
    var pages_with_score = 0;
    var total_available_score = 0;
    for (var p in pages) {
        if(pages.hasOwnProperty(p)){
            var page = pages[p];
            if(page.has_score){
                total_score += (page.score * page.weighting);
                total_available_score += page.weighting;
                pages_with_score++;
            }
        }
    }
    if(pages_with_score > 0 ){
        return (total_score / total_available_score);
    }
    return -1;
}
// on iOS devices the iframe expands its size to encapsulate all of the content
// which causes positioning issues for elements with position fixed/absolute

// this plugin hides the iframe content so that it can calcutate the iframe size (window.self.innerHeight)
// then applies that size to the html and body elements to prevent the iframe from expanding

(function ($) {
    setTimeout(function () {
        if ( (window.self !== window.parent && $('html').hasClass('ios')) ) {
            var $doc = window.self;
            var $body = $('body');
            var $both = $('html, body');
            
            $body.addClass('ios-scroll-fix');
            
            // move the scrolling from the iframe to the <body>
            $both.css({
                'box-sizing': 'border-box',
                'overflow-x': 'hidden',
                'overflow-y': 'auto',
                'min-height': 0,
                '-webkit-overflow-scrolling': 'touch'
            });

            // clip the body size
            $body.css({
                'position': 'absolute',
                'top': 0,
                'left': 0,
                'right': 0,
                'bottom': 0
            })
            
            var old_h = $doc.innerHeight;
            var old_w = $doc.innerWidth;
            var done = false;
            var count = 0;

            var resize_interval = null;

            var resizeContent = function() {
                // recalculate sizes if the device rotates
                // there's no decent way to wait for the orientation change to finish
                // so on orientationchange we check the old width against the current width until they are different

                var h = $doc.innerHeight;
                var w = $doc.innerWidth;
                
                count++;
                
                if ((old_w !== w || count > 20) && !done) {
                    $both.show();
                    $both.css({
                        'height': h,
                        'width': w,
                        'min-height': 0
                    });

                    old_h = h;
                    old_w = w;
                    setTimeout(function () {
                        $(window).trigger('resize');
                        $body.find('.mejs-video').trigger('resize');
                        // #pew needs position relative so that absolute positioned elements work as expected
                        $body.find("#pew").css('position', 'relative');

                        clearInterval(resize_interval)
                    }, 1);
                    done = true
                }
            };

            function doResize() {
                clearInterval(resize_interval)

                count = 0;
                done = false;
                // we need to hide the iframe's content 
                // so that we can calculate what the iframe size is meant to be
                // since iOS iframes expand to fit their content
                $both.hide();
                resize_interval = setInterval(function() {resizeContent()}, 100);
            };
            doResize();

            
            $(window).on('orientationchange', function () {
                doResize();
            })
            
        }
    },1);
})(jQuery);

function isNumber(n){return !isNaN(parseFloat(n))&&isFinite(n);};
(function($){
    $.fn.extend({
        accessibility_fixes: function(){
            var isIE11 = !!window.MSInputMethodContext && !!document.documentMode;
            var shiftKeyDown = false;
            
            return this.each(function () {
                var $this = $(this);
                var modalOpen = false;
                //body should have called this to make modals findable
                //Make the page title -if available- the first thing that is focused on for screen readers
                var $header_title = $this.find('[data-role="page.name"]').first();

                var $load_anchor = $('.load_anchor')[0];
                
                $this.find('.htmlText').attr('tabindex', '0');
                
                // Because headers can be customised, we add the skip link programatically  
                var $skipToLink = $("<a class='skip-to-content-link' href='#main-content'>Skip to content</a>");

                // Added as an inline style as causing issues with legacy projects that do not have access to required stylesheets
                $skipToLink.css({
                    background: '#e77e23',
                    left: '50%',
                    padding: '8px',
                    position: 'absolute',
                    transform: 'translateY(-500%)',
                    transition: 'transform 0.3s',
                    visibility: 'hidden'
                });

                if ($header_title.length) {
                    $header_title.attr('tabindex', '0');
                    $header_title.css('outline', 'none');
                    if ( $header_title.closest('.project__header, .e-contains-paw').length ) {
                        // focus the page title but only if it is in the header or body
                        $header_title.focus();
                    }
                }
                
                var $pageNameInHeader = $('[data-role="page.name"]', '.project__header');
                var $projectHeader = $('.project__header');

                if ($pageNameInHeader.length) {
                    // Ideally we will add the skip to link to the page name as this is where focus goes normally
                    $pageNameInHeader.first().after($skipToLink);
                } else if ($projectHeader.length) {
                    // If there isn't a page name present we still want the skip link, but we will add it at the start of the header bar
                    $projectHeader.first().prepend($skipToLink);
                } else {
                    // Otherwise we add to the body
                    $('#__body__moved').prepend($skipToLink);
                }
                
                var modalShow = function (e) {
                    modalOpen = true;
                    var $modal_shown = $(e.target);
                    var $mod_title = $modal_shown.find(".modal_title");
                    var $mod_body = $modal_shown.find(".modal_body");
                    var $modal_backdrop = $modal_shown.find(".modal__backdrop");
                    
                    // Fix aria labels
                    $modal_backdrop.removeAttr("aria-hidden");
                    $modal_shown.attr('aria-modal', 'true').attr('role', 'dialog');

                    
                    if($mod_title.length === 0){
                        $mod_title = $modal_shown.find(".modal__title");
                    }
                    // if($mod_body.length === 0){
                    //     $mod_body = $modal_shown.find(".modal__body").find("*");
                    // }
                    if($mod_body.length){
                        $mod_body.attr("tabindex", "0");
                    }
                    //if there is a modal title set up normally, focus on it
                    if($mod_title.length){
                        $mod_title.attr("tabindex", "0");
                        setTimeout(function(){$mod_title.focus();}, 51);
                    }else{
                        //if there is no title in the modal, just focus on the first div inside it so accessibility users don't
                        //have to scroll through whole page to focus on the modal content
                        var $firstChild = $modal_shown.find("div:first");
                        $firstChild.attr("tabindex", "0");
                        setTimeout(function(){$firstChild.focus();}, 51);
                    }
                    
                    //trap focus inside the modal
                    $("#" + $modal_shown.attr("id") + " *:tabbable").each(function(index){
                        //@TODO add a class here and check tab when focus changes to stop focus going to url bar on IE11
                        if(isIE11){ $(this).addClass('ie11-focusable') }
                        $(this).attr("tabindex", "40");
                    });
                    
                }
                
                $this.find(".modal").off("shown", modalShow).on("shown", modalShow);
                
                var modalHide = function (event) {
                    
                    modalOpen = false;
                    if(isIE11){ $(".ie11-focusable").removeClass('ie11-focusable') }
                    setTimeout(function(){
                        if (e.elucidat.navigating !== "loading") {
                            // Timeout to allow  time for page to change if the modal close link takes you to next page
                            // modal closed, get modal id
                            var $modal = $(event.target);
                            var $modal_id = $modal.attr("id");

                            // if the modal dismiss button has a link just follow the link instead of trying to focus the trigger button
                            var $modalDismissButton = $modal.find('.button[data-dismiss="modal"]')
                            var dismissTarget = $modalDismissButton.attr('href');
                            if (dismissTarget && dismissTarget !== '#') {
                                return;
                            }

                            // find the button that opened the modal so that we can return the focus to it
                            var $modalOpenerLink = $this.find('[href="#' + $modal_id + '"]:visible, [data-target="#' + $modal_id + '"]:visible');

                            if ($modalOpenerLink.length) {

                                // check if the trigger button was part of a menu so we can return focus to menu
                                var $targetMenu = $modalOpenerLink.closest('.project_menu, .project__menu');

                                if ($targetMenu.length) {
                                    if ($targetMenu.hasClass('open')) {
                                        $modalOpenerLink.focus();
                                    } else {
                                        if ($buttonThatOpenedMenu) {
                                            $buttonThatOpenedMenu.focus();
                                        } else if ($load_anchor) {
                                            $load_anchor.focus();
                                        }
                                    }
                                } else {
                                    // DEFAULT
                                    $modalOpenerLink.focus();
                                }

                            } else {
                                // Fallback, might be using new method of putting modals in forms with no reference on buttons
                                // check for a form parent, and whether that parent has a save button
                                var $parentForm = $modal.parents('form').find('.save_button');
                                if ($parentForm.length) {
                                    $parentForm.focus();
                                } else {
                                    // FALLBACK, no items found that have reference to opening the modal, so go back to header_title
                                    if ($header_title.length) {
                                        $header_title.focus();
                                    } else if ($load_anchor) {
                                        // no header title, focus on page anchor, fallback for the fallback
                                        $load_anchor.focus();
                                    }
                                }
                            }
                        }
                        
                    }, 10);
                }
                
                $this.find(".modal").off("hidden", modalHide).on("hidden", modalHide);
                                                
                //macs default screenreader wont read a link's title, it needs an aria-label, so if it has a title, and doesnt already
                // have a label (and isnt hidden to screenreaders) give it a label that matches the title (and if text is empty)
                $this.find("a[title]").each(function(){
                    var $titledLink = $(this);
                    if($titledLink.text() == ""){
                        var $linkTitle = $titledLink.attr("title");
                        if(!$titledLink.attr("aria-label") && !$titledLink.attr("aria-hidden") && $linkTitle.length > 0){
                            $titledLink.attr("aria-label", $linkTitle);
                        }
                    }else{
                        $titledLink.removeAttr("title");
                    }
                });
                
                //Buildup on shown move focus
                $this.on("shown", function(e){
                    var $target = $(e.target);
                    var $target_button = $(e.target).find("button");
                    if($target.next().hasClass('buildup') || $target.prev().hasClass('buildup')){
                        $target_button.attr("style", "display: block !important");
                        $target_button.focus();
                    }
                });

                $('.grid--buildup').each(function(){
                    var $buildup_wrapper = $(this);
                    var $buildups = $buildup_wrapper.find('.buildup');
                    var count = 0;
                    $buildups.each(function(){
                        var $this = $(this);
                        var text = $this.text();
                        var $button = $this.find("button");
                        if(count === $buildups.length-1){
                            var finalElementText = $button.data("final")
                            $button.attr('title', finalElementText);
                        }
                        $button.attr("aria-label", text);
                        count++;
                    });
                });
                
                //fallback in case controlsready doesnt fire to hide full screen button from screen readers for video
                var fscrnCount = 0;
                var $fsBtn;
                var $volSlider;
                var fsInterval = setInterval(function(){
                    //check every second for eleven secs to see if the controls are there
                    $fsBtn = $this.find('.mejs-fullscreen-button button[aria-label="Fullscreen"]');
                    $volSlider = $this.find("a.mejs-volume-slider");
                    var $volButton = $this.find(".mejs-volume-button");
                    if($fsBtn.length){
                        //fullscreen button exists, controls must be ready
                        $this.find('.flipcard .flipcard__back :focusable').attr('aria-hidden', true);
                        $this.find('div.video_player').attr('aria-busy', 'false');
                        $fsBtn.attr("aria-hidden", "true");
                        clearInterval(fsInterval);
                    }else if(fscrnCount > 10){
                        clearInterval(fsInterval);
                    }else{
                        fscrnCount++;
                    }
                    
                    if($volSlider.length){
                        //give volume slider a positive tabindex to prevent tab blocks
                        $volSlider.each(function(){
                            $(this).attr("tabindex", -1);
                        });
                        $volButton.keyup(function(e){
                            if(e.keyCode === 38 || e.keyCode === 40){
                                //up and down keycodes
                                $('.mejs-volume-slider').attr("tabindex", "-1");
                                setTimeout(function(){
                                    $(".mejs-volume-slider").fadeOut("fast");
                                }, 300);
                            }
                        });
                    }
                }, 1000);
                
                $("a.mejs-volume-slider").attr("tabindex", "-1");
                
                //hide the fullscreen from screen readers - the way it should hopefully happen
                $this.on("controlsready", function(){
                    //controls ready fired, full screen btn should be there
                    $fsBtn = $this.find('.mejs-fullscreen-button button[aria-label="Fullscreen"]');
                    $volSlider = $this.find("a.mejs-volume-slider");
                    var $volButton = $this.find(".mejs-volume-button");
                    //just in case it isn't as controlsready isn't super reliable, dbl check
                    if($fsBtn.length){
                        //fullscreen button exists as it should, primo
                        $this.find('.flipcard .flipcard__back :focusable').attr('aria-hidden', true);
                        $this.find('div.video_player').attr('aria-busy', 'false');
                        $fsBtn.attr("aria-hidden", "true");
                        //give volume slider a positive tabindex to prevent tab blocks
                        clearInterval(fsInterval);
                    }else{
                        //controlsready has triggered when the controls aren't actually ready, something's gone wrong elsewhere
                        //Fallback above should continue searching for fullscreen button when it eventually shows up anyway
                        //Hopefully shouldnt ever run
                        console.warn("Potential Elucidat Error: Fullscreen Button does not exist despite controlsready being triggered");
                    }
                    if($volSlider.length){
                        setTimeout(function(){
                            $volSlider.attr("tabindex", '-1');
                            fixVolumeTrap();
                        }, 500);
                        
                    }
                });
                
                //When a carousel changes slide, make sure that focus is given to the content of the active slide
                $this.find(".carousel").on("slid.bs.carousel", function(){
                    var $active_slide = $(this).find(".active");
                    
                    setTimeout(function() {
                        $active_slide.find(':focusable').first().focus();
                    }, 1);
                });

                //Insure that on page load flip card backs are hidden for IE screen readers.
                $this.find('.flipcard .flipcard__back').attr('aria-hidden', true);
                $this.find('.flipcard .flipcard__back :focusable').attr('aria-hidden', true);
                        
                $this.find('.flipcard').each(function() {
                    var $flipcard = $(this);
                    
                    // Stop the back side of the flip card being tabbable
                    $flipcard.find('[aria-hidden="true"]').find(':focusable').attr('tabindex', '-1');
                    
                    $flipcard.on('shown hidden', function(event) {
                        var $hidden = $flipcard.find('[aria-hidden="true"]');
                        var $shown = $flipcard.find('[aria-hidden="false"]');
                        
                        $hidden.find(':focusable').attr('tabindex', '-1');
                        $shown.find(':focusable').attr('tabindex', '0');
                        
                        setTimeout(function() {
                            $shown.find(':focusable').first().focus();
                        }, 1);
                    });
                });
                
                // Sort out aria-hidden on accordions
                $this.find('.accordion-group').each(function() {
                    var $accordion = $(this);
                    var $accordionHeading = $accordion.find('a.accordion-heading');
                    var $accordionBody = $accordion.find('.accordion__body');
                    
                    // Tell aria this element controls the expanded state of the
                    // body
                    // $accordionHeading.attr('aria-controls', $accordionBody.attr('id'));
                    $accordionHeading.attr('aria-expanded', 'false');
                    
                    // On page load stop screenreader reading any accordion 
                    // content which is hidden
                    if ( $accordionBody.hasClass('in') ) {
                        $accordionBody.attr('tabindex', '0').attr('aria-hidden', 'false');
                        $accordionBody.find(':focusable').attr('tabindex', '0').attr('aria-hidden', 'false');
                    } else {
                        $accordionBody.attr('tabindex', '-1').attr('aria-hidden', 'true');
                        $accordionBody.find(':focusable').attr('tabindex', '-1').attr('aria-hidden', 'true');
                    }
                    
                    // Add expanded label to expanded accor
                    $accordion.on('click', function(event) {
                        setTimeout(function() {
                            if ( $accordionHeading.hasClass('opened') ) {
                                $accordionHeading.attr('aria-expanded', 'true');
                                // var label = $accordionHeading.text().trim() + ' expanded';
                                // $accordionHeading.attr('aria-label', label);
                            } else {
                                $accordionHeading.attr('aria-expanded', 'false');
                                // var label = $accordionHeading.text().trim();
                                // $accordionHeading.attr('aria-label', label);
                            }
                        }, 1);
                    });
                    
                    // when an accordion is opened or closed
                    // show the screen reader the content which is now displayed
                    // and reading any accordion content which is hidden
                    $accordion.on('shown hidden', function(event) {
                        if ( $accordionBody.hasClass('in') ) {
                            $accordionBody.attr('tabindex', '0').attr('aria-hidden', 'false');
                            $accordionBody.find(':focusable').attr('tabindex', '0').attr('aria-hidden', 'false');
                            
                            setTimeout(function() {
                                $accordionBody.find(':focusable').first().focus();
                            }, 1);
                        } else {
                            $accordionBody.attr('tabindex', '-1').attr('aria-hidden', 'true');
                            $accordionBody.find(':focusable').attr('tabindex', '-1').attr('aria-hidden', 'true');
                        }
                    });
                });
                
                // Sort out aria-hidden on timeline-accordion
                $this.find('.timeline__entry').each(function() {
                    var $timelineEntry = $(this);
                    var $timelineEntryBody = $timelineEntry.find('.entry__body');
                    var $timelineEntryButton = $timelineEntry.find('.accordion-heading button');
                    
                    // Add aria-labels to the links
                    var label = $timelineEntry.find('.entry__header__text').text().trim();
                    $timelineEntryButton.attr('aria-label', label);
                    $timelineEntryButton.attr('aria-expanded', 'false');
                    
                    // Let aria know that the timeline has expanded
                    $timelineEntryButton.on('click', function (event) {
                        setTimeout(function() {
                            if ( $timelineEntryButton.hasClass('collapsed') ) {
                                $timelineEntryButton.attr('aria-expanded', 'false');
                            } else {
                                $timelineEntryButton.attr('aria-expanded', 'true');
                            }
                        }, 1);
                    });
                    
                    // On page load stop screenreader reading any accordion 
                    // content which is hidden
                    if ( $timelineEntryBody.hasClass('in') ) {
                        $timelineEntryBody.find(':focusable').attr('tabindex', '0');
                    } else {
                        $timelineEntryBody.find(':focusable').attr('tabindex', '-1');
                    }
                    
                    // when an accordion is opened or closed
                    // show the screen reader the content which is now displayed
                    // and reading any accordion content which is hidden
                    $timelineEntry.on('shown hidden', function(event) {
                        if ( $timelineEntryBody.hasClass('in') ) {
                            $timelineEntryBody.find(':focusable').attr('tabindex', '0');
                            
                            setTimeout(function() {
                                $timelineEntryBody.find(':focusable').first().focus();
                            }, 1);
                        } else {
                            $timelineEntryBody.find(':focusable').attr('tabindex', '-1');
                        }
                    });
                });

                // Update page progress navigation links to have aria labels.
                $this.find('.pageProgress__menu__item a').each(function() {
                    var $this = $(this)
                    var $trimmedLinkText = $this.text().trim();
                    var titleTextAttr = $this.attr("data-title", $trimmedLinkText);
                    if ($this.closest('.e-section-completed').length) {
                        $this.attr("aria-label", titleTextAttr + " completed");
                    } else { 
                        $this.attr("aria-label", $trimmedLinkText);
                    }
                });

                // Update aria labels for hotspots when the hotspot has been
                // visitited
                $this.find('.hotspot').each(function() {
                    var $hotspot = $(this);
                    
                    var text = $hotspot.text().trim();
                    $hotspot.attr('aria-label', text);
                    
                    $hotspot.on('click', function(event) {
                        var text = $hotspot.text().trim() + ' visited';
                        $hotspot.attr('aria-label', text);
                    });
                });
                
                //fix for tooltip menu types ony reading “text”
                $('.explorer__tooltip .htmlText').each(function(){
                    var $this = $(this);
                    var $text = $(this).text().trim();
                    $this.attr('aria-label', $text);
                });
                
                $('.explorer__tooltip .button').each(function(){
                    var $this = $(this);
                    var $text = $(this).text().trim();
                    $this.attr('aria-label', $text);
                });

                //Menu - giving correct roles to navigation menu items to prevent phantom screenreader elements
                var $menu_container = $this.find('[role="menu"]');
                $(document).on('elucidat.navigation.loaded', function (event, nav_data, $nav_obj) {
                    updateNavLinksDisabled();
                });
                $(document).on('elucidat.page.ready', function (event, page_data, $new_page) {
                    updateNavLinksDisabled();
                });
                $(document).on('elucidat.page.change', function (event, page_data) {
                    updateNavLinksDisabled();
                });
                $(document).on('elucidat.page.open', function (event, page_data, $new_page) {
                    updateNavLinksDisabled();
                });
                $(document).on('elucidat.page.complete', function (event, page_data, $new_page) {
                    updateNavLinksDisabled();
                });
                $(document).on('elucidat.progress', function (event, progress_percentage, raw_score, score_percentage) {
                    updateNavLinksDisabled();
                });
                $(document).on('elucidat.achievement', function (event, achievement_code) {
                    updateNavLinksDisabled();
                });
                
                function updateNavLinksDisabled(){
                    //When a new page loads or a page is completed, we need to update the navigation links as their disabled state might have changed
                    $menu_container.find("li a").each(function(){
                        //find each anchor and make it behvae as a button to prevent screenreader reading href, and give it aria label to read out instead
                        var $anchor = $(this);
                        var anchor_text = $anchor.text().trim();
                        if($anchor.hasClass('e-link-disabled-by-rule')){
                            $anchor.attr('aria-disabled', 'true').attr('tabindex', '-1');
                        }else{
                            if (!$('.project__menu').hasClass('open') && $anchor.attr('tabindex') !== '-1') {
                                $anchor.removeAttr('aria-disabled').removeAttr('tabindex');
                            }
                            if($anchor.hasClass('menu__head__entry__inner')){
                                var $anchor_text = $anchor.find('span.text');
                                if ( $anchor_text.is(':hidden') ) {
                                    $anchor.attr('aria-label', $anchor_text.text() )
                                }
                            }
                        }
                    });
                }
                    
                
                var $buttonThatOpenedMenu;
                
                $this.on('click.interaction.shown', function(e){
                    var $e = $(e.target);
                    if($('.project__menu').hasClass('open')){
                        var $closest_a = $e.closest('a');
                        if($closest_a.attr('data-dismiss') === 'dropdown' || $closest_a.attr('data-toggle') === 'modal' || $e.hasClass('project__menu') || $e.hasClass('menu__wrap')){
                            unHidePageContentOnMenuClose();
                            if($buttonThatOpenedMenu){
                                if($buttonThatOpenedMenu.attr('data-target')){
                                    setTimeout(function(){
                                        $buttonThatOpenedMenu.focus();
                                    }, 50);
                                }
                            } else if ($load_anchor) {
                                setTimeout(function(){
                                    $load_anchor.focus();
                                }, 50);
                            }
                        }
                    }

                    if($e.hasClass('ti-menu')){
                        //The menu is opening! Lets Focus!
                        hidePageContentOnMenuOpen()
                        var $menu = $($e.parent().attr('data-target'));
                        $buttonThatOpenedMenu = $e.parent();
                        var $first_anchor = $menu.find('a.itemInner:visible').first();
                        setTimeout(function(){$first_anchor.focus();}, 50);
                    }else if($e.hasClass('menuButton')){
                        hidePageContentOnMenuOpen()
                        var $menu = $($e.attr('data-target'));
                        $buttonThatOpenedMenu = $e;
                        var $first_anchor = $menu.find('a.itemInner:visible').first();
                        setTimeout(function(){$first_anchor.focus();}, 50);
                    } 
                });
                
                var $project_menu = $('.project__menu');
                var $project_menu_links = $project_menu.find('li a');
                if(!$project_menu.hasClass('open')){
                    $project_menu.attr('aria-hidden', true);
                    $project_menu_links.each(function(){
                        $(this).attr('tabindex', '-1');
                    });
                }
                
                function hidePageContentOnMenuOpen(){
                    $project_menu.siblings().attr('aria-hidden', true);
                    $project_menu.attr('aria-hidden', false);
                    $project_menu_links.each(function(){
                        if(!$(this).attr('aria-disabled')){
                            $(this).removeAttr('tabindex');
                        }
                    });
                }
                function unHidePageContentOnMenuClose(){
                    $project_menu.siblings().attr('aria-hidden', false);
                    $project_menu.attr('aria-hidden', true);
                    $project_menu_links.each(function(){
                        $(this).attr('tabindex', '-1');
                    });
                }
                
                $('a.toolbar__button').each(fixButtonLabels);
                // $('.menu__head__entry a').each(fixButtonLabels);
                
                function fixButtonLabels(){
                    var $this = $(this);
                    var $txt = $this.text().trim();
                    $this.attr('aria-label', $txt);
                }
                var $current_focus = $(':focus');
                var $visible_menu_links = $project_menu.find('a:visible');
                    
                //make sure focus doesn't leave the menu
                document.addEventListener('focus', function( event ) {
                    if ( $project_menu.hasClass('open') 
                        && !$.contains($project_menu[0], event.target )  
                        //&& !$(event.target).hasClass('menuButton')
                    ) {
                        event.stopPropagation();
                        if($current_focus === $visible_menu_links.last()){
                            $visible_menu_links.first().focus();
                        }else if($current_focus === $visible_menu_links.first()){
                            $visible_menu_links.last().focus();
                        }else{
                            $visible_menu_links.first().focus();
                        }
                    }
                    $current_focus = $(':focus');
                }, true);
                
                //Fix for the volume slider tabbing trap in some browsers, when tabbing through controls and using the up/down to change volume,
                // the slider is never called to disappear, so lets do that, quickly so people can tab on without delay
                function fixVolumeTrap(){
                    $('.mejs-volume-button').attr("tabindex", "-1");
                    $(".mejs-volume-button button").keyup(function(e){
                        if(e.keyCode === 38 || e.keyCode === 40){
                            //up and down keycodes -  The mediaelements rebuilds the whole element with tabindex 0 when the volume changes, so it needs to be put back to -1 every time
                            $('.mejs-volume-slider').attr("tabindex", "-1");
                            setTimeout(function(){
                                $(".mejs-volume-slider").fadeOut("fast");
                            }, 300);
                        }else if(e.keyCode === 9){
                            setTimeout(function(){
                                $(".mejs-volume-slider").fadeOut("fast");
                            }, 300);
                        }
                    });
                }
                //call it initially
                fixVolumeTrap();
                
                
                
                /// Fix for multiple response radio buttons
                var $multi_response_forms = $('form.multiple_response');
                //find each multiple response form
                $multi_response_forms.each(function(){
                    var $form = $(this),
                        $question_rows = $form.find('tr.question'),
                        $headers = $form.find('th.answer__title .text'),
                        header_objects = [],
                        $inputs = $form.find('input[type="radio"]');
                    $form.attr('role', 'application');
                    //setTimeout(function(){$form.find('table').attr('role', 'application');}, 1);
                    // go through each header which labels what the answer will be textually (usually True and False)
                    // and add that text to an array so we can add it into the aria label later
                    $headers.each(function(i){
                        var $h = $(this);
                        header_objects.push($h);
                    });
                    //make sure the inputs aren't tabbable to prevent double tabbing to get to the next question group
                    $inputs.attr('tabindex', '-1');
                        
                    //A row is a question and we want the radios to relate to that group only, so give each question role radiogroup
                    $question_rows.attr('role', 'radiogroup');
                    
                    //go through each question
                    $question_rows.each(function(){
                        var $row = $(this),
                            $answers = $row.find('td.answer'),
                            $question = $row.find('td.question__inner'),
                            $question_label = $question.find('label'),
                            question_text = $question.text(),
                            $inputs = $row.find('input');
                        
                        $question.attr('tabindex', '0');
                        //the radio group needs to be aria-labelledby the question text
                        $row.attr('aria-labelledby', $question_label.attr('id'));
                        
                        $question_label.removeAttr('for');
                        //this changes the aria-checked (which reads out if the radio button is selected) attribute when the input selection changes,
                        $inputs.each(function(){
                            var $input = $(this);
                            var $answer = $input.closest('.answer');
                            
                            $input.on('change', function(e){
                                var $this_input = $(this);
                                //this needs to go in a timeout because of javascript/release/build/forms/jquery.questionnaire_answer.js line 190
                                setTimeout(function(){
                                    if($this_input.prop('checked')){
                                        $input.closest('.question').find('.answer').attr('aria-checked', 'false').attr('tabindex', '-1');
                                        $answer.attr('aria-checked', 'true');
                                        $answer.attr('tabindex', '0');
                                    }
                                }, 25);
                            });
                        });
                        // Give all the answers (pseudo-radio buttons) a role of radio so the screenreader knows how to treat them
                        $answers.attr('role', 'radio').attr('tabindex', '-1');
                        $answers.first().attr('tabindex', '0');
                        
                        $answers.each(function(i){
                            // Go through each answer and give it an aria-label of the question + the answer text and set initial aria-checked state
                            var $answer = $(this);
                            $answer.attr('aria-label', header_objects[i].text()).attr('aria-setsize', $answers.length).attr('aria-posinset', i+1);
                            switch ($answer.hasClass('selected')) {
                                case true:
                                    $answer.attr('aria-checked', 'true');
                                    $answers.attr('tabindex', '-1');
                                    $answer.attr('tabindex', '0');
                                    break;
                                default:
                                    $answer.attr('aria-checked', 'false');
                            }
                            
                            //in radio buttons, when theres a completion event, if the outcome is visible it should also be audible to screen readers
                            $('body').on('elucidat.page.complete', function(event, page_data, $new_page){
                                if ($form.hasClass('e-outcome--show')){
                                    if($row.hasClass('answered-correct')){
                                        $answer.attr('aria-label', $answer.attr('aria-label') + '.  Answered Correctly.');
                                    }else if($row.hasClass('answered-wrong')){
                                        $answer.attr('aria-label', $answer.attr('aria-label') + '.  Answered Incorrectly.');
                                    }
                                }
                                //when the completion event happens it sets all the aria-checked to false so we need to reset them based on what's selected
                                if($answer.hasClass('selected')){ 
                                    $answer.attr('aria-checked', 'true');
                                }else{
                                    $answer.attr('aria-checked', 'false');
                                }
                            });
                        })
                    });
                    
                    
                    //forces redraw so roles get updated to the screenreader
                    $form.hide().show(0);
                    
                });
                
                //single choice radio button accessibility fixes 
                function fixRadioBtns($form){
                    var $q_header = $form.find('.question__header');
                    var $form_children = $form.children();
                    var $group = $('<div></div>');
                    $form.find('.grid__inner, .explorer__inner').attr('role', 'radiogroup').attr('aria-labelledby', $q_header.attr('id'));
                    $form.append($group);
                    $form_children.appendTo($group);
                }
                
                $('form.single_choice').each(function(){
                    var $form = $(this);
                    fixRadioBtns($form);
                });
                
                $('form.form--ieq.questionnaire').has('input[type="radio"]').each(function(){
                    var $form = $(this);
                    fixRadioBtns($form);
                })
                
                $(document).on('keydown', function(event){
                    switch (event.keyCode) {
                        case 16:
                            shiftKeyDown = true;
                            break;
                        case 9:
                            //tab, for ie11 if a modal is open we need to trap focus so it doesnt go to the url bar - bit of a hack, yuck
                            if(isIE11 && modalOpen){
                                var $tabElems = $(".ie11-focusable");
                                if( shiftKeyDown && $tabElems[0] === document.activeElement ){
                                    //the first focusable element has focus and the user is shift tabbing, so lets send them to the last element 
                                    $tabElems.last().focus();
                                    event.preventDefault();
                                }else if ( !shiftKeyDown && $tabElems[$tabElems.length - 1] === document.activeElement ) {
                                    //the last focusable element has focus so lets move it to the first element
                                    $tabElems.first().focus();
                                    event.preventDefault();
                                }
                            }
                            break;
                    }
                });
                
                // Multiple response overriding keypresses to be compatible with W3 accessibility standards ( found here https://www.w3.org/TR/wai-aria-practices/examples/radio/radio-1/radio-1.html )
                $(document).on('keyup', function(event){
                    // KEycodes tab = 9 , up = 38, down = 40, space = 32, 
                    if(event.keyCode === 16 ){
                        shiftKeyDown = false;
                    }
                    //only if it's in the multiple response and on a radio button thingymajig
                    var $target = $(event.target);
                    if($target.closest('form').hasClass('multiple_response') && $target.hasClass('answer')){
                        switch (event.keyCode) {
                            case 38:
                                //up arrow press - by focus we also mean select
                                //Moves focus to previous radio button in the group.
                                //If focus is on the first radio button in the group, move focus to the last radio button.
                                var $moving_focus_to = $target.prev('.answer');
                                if(!$moving_focus_to.length){
                                    $moving_focus_to = $target.parent().find('.answer').last();
                                }
                                if($moving_focus_to.length){
                                    $target.parent().find('.answer').attr('tabindex', '-1');
                                    $moving_focus_to.attr('tabindex', '0');
                                    $moving_focus_to.find('input').click();
                                    setTimeout(function(){
                                        $moving_focus_to.focus();
                                    }, 30);
                                }
                                event.preventDefault();
                                break;
                            case 40:
                                //down arrow press
                                //Moves focus to next radio button in the group
                                //If focus is on the last radio button in the group, move focus to the first radio button.
                                var $moving_focus_to = $target.next('.answer');
                                if(!$moving_focus_to.length){
                                    $moving_focus_to = $target.parent().find('.answer').first();
                                }
                                if($moving_focus_to.length){
                                    $target.parent().find('.answer').attr('tabindex', '-1');
                                    $moving_focus_to.attr('tabindex', '0').attr('aria-checked', 'true');
                                    $moving_focus_to.find('input').click();
                                    setTimeout(function(){
                                        $moving_focus_to.focus();
                                    }, 30);
                                }
                                event.preventDefault();
                                break;
                            case 32:
                            case 13:
                                //space bar press
                                //If the radio button with focus is unchecked, it's state will be changed to checked.
                                if(!$target.hasClass('selected')){
                                    $target.click();
                                }
                                event.preventDefault();
                                break;
                        }
                    }
                });
                
            });
        }
    });
    
})(jQuery);
// function that adds a class template_* to body depending on which page type you are in
// it first clears all classes that the body may have
// then adds the class belonging to that page type template
(function($){
    $.fn.extend({
        body_class: function(options) {
            //Settings list and the default values
            var defaults = {
                class_src: null
            };
            var options = $.extend(defaults, options);
            return this.each(function() {
                // should be the body tag
                var $this = $(this);
                // remove page completed class
                if($this.prop('tagName') !== 'BODY') { return; }
                
                $this.removeClass('page_completed');
                // update the template class
                // remove template class from body
                $this[0].className = $this[0].className.replace(/\btemplate_.*?\b/g, '').replace('  ',' ');
                // get classes from moved body and add, if needed
                if (options.class_src && options.class_src.length) {
                    var new_class = options.class_src.attr('class');
                    if (new_class) {
                        var new_class_split = new_class.split(' ');
                        for (var c=0;c<new_class_split.length;c++) {
                            $this.addClass(new_class_split[c]);
                        }
                    }
                    // clear class off #body_moved
                    options.class_src.attr('class','');
                }
            });
        }   
    });
})(jQuery);

(function($){

    $.fn.extend({
        body_height: function(options) {
        
            //Settings list and the default values
            var defaults = {};
            var options = $.extend(defaults, options);
            
            var body_h = parseInt( $('body').css('min-height') );

            return this.each(function() {
                
                var $this = $(this);

                // find offset position
                var offset = $this.offset();

                // subtract from height
                var new_height = body_h - offset.top;

                // and set min-height
                $this.css('min-height', new_height + 'px');

            });
        }   
    });
        
})(jQuery);
(function($){
    $.fn.extend({
        contains_paw: function() {
            return this.each(function() {
                // mark the final containing element with a special class
                var $this = $(this);
                var $last_parent = $this;
                $this.parentsUntil( '#__body__moved' ).each(function () {
                    $last_parent = $(this);
                });
                $last_parent.addClass('e-contains-paw');
            });
        }   
    });
})(jQuery);
(function ($) {
    var allCookies;

    function loadAndParseCookies() {
        return document.cookie
            .split(';')
            .map(function (c) {
                return c.trim();
            })
            .map(function (c) {
                return c.split('=');
            })
            .reduce(function (acc, c) {
                var newObject = Object.assign({}, acc);
                newObject[c[0]] = c[1];
                return newObject;
            });
    };

    function getAll() { 
        if (allCookies == null) {
          allCookies = loadAndParseCookies()
        }
        return allCookies;
    };

    function exists(key) {
        var cookies = getAll();
        return cookies.hasOwnProperty(key);
    };

    function get(key) {
        return exists(key) ? getAll()[key] : null;
    };

    $.cookies = {};
    $.cookies.all = getAll;
    $.cookies.has = exists;
    $.cookies.get = get;
})(jQuery);


(function($){

    $.fn.extend({
        fix_carousel_slides: function( $context ) {
            return this.each(function() {

                var href, $this = $(this), $target = $context.find($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')); //strip for ie7
                // if all items have active - then

                var $items = $target.find('.item').filter(function(){
                    return $(this).parents('.add-option-template').length ? false : true;
                });
                
                // if all are active - remove
            	if (!$items.not(".active").length)
            		$items.removeClass('active');
                
            	// and if none are active - make the first active
                if (!$items.filter('.active').length)
                    $items.first().addClass('active');
            });
        }   
    });
})(jQuery);
(function($){
    $.fn.extend({
        chapter_link: function( options ) {
            //Settings list and the default values
            var defaults = {};
            var options = $.extend(defaults, options);
            
            return this.each(function () {
                // check if page is loaded already - if so take from cache
                // the url
                var $this = $(this);

                var perc_progress = options.getProgress();
                var score = options.getScore();

                $this.find('.chapter_percentage').each(function () {
                    var $perc = $(this);
                    if ($perc.children().length)
                        // this drives course progress bars
                        $perc.find('.bar').css( 'width', perc_progress + '%' );
                    else
                        $perc.text( Math.round(perc_progress) + '%' );
                });

                $this.find('.chapter_score').each(function () {
                    var $perc = $(this);
                    if ($perc.children().length)
                        // this drives course progress bars
                        $perc.find('.bar').css( 'width', score + '%' );
                    else
                        $perc.text( Math.round(score) + '%' );
                });

                if (perc_progress == 100)
                    $this.addClass('e-chapter-complete');

                if (options.score_possible && options.getScoreResult())
                    $this.addClass('e-chapter-passed');

            });
        },
        fix_links: function( context ) {
            // Loop through all the links on the page.
            // We want to store a reference to each link against the page it's linking to.

            //Clear the links to the page, we don't want to double up if this function is called twice.
            $.each(context.pages, function(i,page) {
                page.links_to_page = [];
            });
            
            return this.each(function () {
                function onClickClose() {
                    //when window closed with close button, we'll directly call unload as if browser close, to ensure we send terminate to lms
                    console.log('//\n//\n// Window Close Triggered\n//');
                    var $this = $(this);
                    var postData = {
                        action: 'terminating',
                        total_score: getCurrentScore(e.elucidat.pages)
                    };
                    //send terminated to parent window for discovery center etc 
                    if(window !== window.top){
                        window.parent.postMessage(JSON.stringify(postData), '*')
                    }

                    //Close button might have a link on it...
                    if($this.attr('href').substring(0,4) === 'http') {
                        console.log('Close button contains link, navigating to new page...');
                        window.open($this.attr('href'), 'continueLink');
                    }

                    //then call the unload function to tell the LMS we are done.
                    e.elucidat.unload();

                    //wait a bit for new window to be opened and LMS Finish to register.
                    setTimeout(function() {
                        if (window.top) {
                            window.top.close();
                        }
                        else {
                            window.close();
                        }
                    },250);

                    return false;
                }

                function onClickNotFound(ev) {
                    ev.preventDefault();
                    console.warn('404, The destination was not found.', 'Link', $(ev.target), 'HREF', decodeURI($(ev.target).attr('href')));
                }

                function onClickNavLink(ev) {
                    ev.preventDefault();
                    //Should this link shuffle the question pools?
                    if($this.attr('data-toggle') === 'shuffle' || context.should_shuffle_pools) {
                        context.should_shuffle_pools = false;
                        context._shuffle_question_pools(true);
                    }

                    Elucidat.navigate(page_request.page_id);


                    // don't stop modal close events
                    if ($this.attr('data-dismiss'))
                        $this.trigger('click.dismiss.'+$this.attr('data-dismiss'));

                    else
                        ev.stopPropagation();
                }

                function onClickInternalLink(ev) {
                    ev.preventDefault();
                    var target = decodeURIComponent($(ev.currentTarget).data('link'));
                    //trim off the #internal bit...
                    if(target === 'pew') {
                        var $target = $('#pew');
                    } else {
                        if(target.indexOf('pa_') === -1) {
                            var $target = $('#pa_' + e.elucidat.current_page + '_' + target);
                        } else {
                            var $target = $('#' + target);
                        }
                    }

                    if($target.length) {
                        var headerHeight = $(".project__header").data("fixed-header-height") || 0;
                        var topPos = $target.offset().top - headerHeight;
                        
                        // check for progress indicators
                        var $progressIndicator = $('.e-js-page-progress.e-pos--sticky');
                        
                        if ( $progressIndicator.length && $progressIndicator.parent('.sticky-wrapper') ) {
                            var stickyOffset = $progressIndicator.parent().offset().top;
                            
                            var windowWidth = $(window).width()
                            var progressIndicatorWidth = $progressIndicator.width();
                            
                            // only adjust the link IF:
                            // - the page is going to scroll past the sticky elements
                            // - the sticky element is bigger than half the screen
                            if ( topPos > stickyOffset && progressIndicatorWidth > (windowWidth/2) ) {
                                var stickyHeight = $progressIndicator.height();
                                topPos = topPos - stickyHeight;
                            }
                        }
                        
                        
                        // // add offset if the item is on a sticky progress indicator
                        // if ($this.hasClass('e-js-progress-itemLink')) {
                        //     var $progressIndicator = $this.parents('.e-js-page-progress');
                        //     
                        //     if ($progressIndicator.length) {
                        //         
                        //         if ($progressIndicator.hasClass('e-pos--sticky')) {
                        //             var windowWidth = $(window).width()
                        //             var progressIndicatorWidth = $progressIndicator.width();
                        //             
                        //             // only add offset if the progress indicator is bigger than half screen
                        //             // or else it means that it is probably sticky on the side of the content
                        //             // meaning it does not need the extra offset
                        //             if (progressIndicatorWidth > (windowWidth/2)) {
                        //                 // console.log('needs offset')
                        //                 var progressOffset = $progressIndicator.height();
                        //                 topPos = topPos - progressOffset;
                        //             }
                        //         }
                        //     }
                        // }
                        
                        Elucidat.navigate_internal(topPos, 1500, 'easeInOutQuint', $target);
                    } else {
                        console.warn('Link in page target not found', target);
                    }
                }
                function onClickNextLink(ev) {
                    goToPrevNextLink(ev, 'next');
                }
                function onClickPrevLink(ev) {
                    goToPrevNextLink(ev, 'previous');
                }
                
                function onClickNotAllowed(ev) {
                    ev.preventDefault();

                    if ( !$this.hasClass('save_button') ) {
                        $('body').trigger('elucidat.navigation.not_allowed', [ ev.currentTarget ]);
                    }
                }

                function goToPrevNextLink(ev, direction) {
                    ev.preventDefault();

                    /**
                     * We don't want to proceed if the click
                     * is on a disabled button.
                     * 
                     * If this class name is changed for CSS or
                     * any other reason, it should be noted that
                     * this could cause unexpected navigation, so
                     * the change should be mirrored here.
                     * 
                     * Note - the button--disabled class
                     * is used here rather than the disabled attribute
                     * so that tooltips can still work for the button.
                     * 
                     * The CSS for the class should give sufficient
                     * indication for the user that the button is inactive
                     * or disabled.
                     */
                    if($this.hasClass('button--disabled')) return;

                    //Should this link shuffle the question pools?
                    if($this.attr('data-toggle') === 'shuffle' || context.should_shuffle_pools) {
                        context.should_shuffle_pools = false;
                        context._shuffle_question_pools(true);
                    }

                    if ( direction === 'next' || direction === 'previous') {
                        Elucidat.navigate(direction);
                    }

                    // don't stop modal close events
                    if ($this.attr('data-dismiss'))
                        $this.trigger('click.dismiss.'+$this.attr('data-dismiss'));

                    else
                        ev.stopPropagation();
                }

                var $this = $(this);
                var page_request;

                var url = $this.attr('href');
                var role = $this.attr('data-role');
                var className = $this.attr('class');

                // ignore mailto links and audio player volume control
                if (url && url.substring(0,6) === 'mailto' || className && className.indexOf('mejs-horizontal-volume-slider') !== -1) {
                    return;
                }

                // Remove existing events
                $this.off('.closeLink');
                $this.off('.navLink');
                $this.off('.prevNext');

                //get all links that don't have an href attribute and give it one, to make screen reader enter key work
                if(!$this.is("[href]")){
                    $this.attr("href", "#!");
                }

                // handle window close links
                if (role && role === 'close') {
                    if($this.attr('href').substring(0,4) === 'http') {
                        //Ensure links on close button open in a new window;
                        $this.attr('target','_blank');
                    }

                    $this.on('click.closeLink', onClickClose);

                } else if(url && url.substring(0,1) !== '#') {

                    var re = /({{|%7B%7B)navigation\.([a-z0-9_]+).url(}}|%7D%7D)/i;
                    var re2 = /({{|%7B%7B)(next|previous)\.url(}}|%7D%7D)/i;
                    var re3 = /({{|%7B%7B)navigation\.([a-z0-9_\-% ]+).internal(}}|%7D%7D)/i;
                    var match, done = false;

                    if ( match = re.exec( url )) {
                        //Match links to a specific page or the first or last page.
                        if ( match[2] ) {

                            if (match[2] === 'first')
                                page_request = context.pages[ context.page_order[0] ];

                            else if (match[2] === 'last')
                                page_request = context.pages[ context.page_order[ context.page_order.length - 1 ] ];

                            else
                                page_request = context.pages[ match[2] ];


                            if (page_request) {

                                // Store reference of all links to a page against the page.
                                // Once progress manage has been run we loop through the links and
                                // set the correct attributes on them (seen, completed, hidden etc).
                                page_request.links_to_page.push($this);

                                $this.on('click.navLink', onClickNavLink);
                            } else {
                                $this.on('click.navLink', onClickNotFound);
                            }
                        }

                    } else if ( match = re2.exec( url )) {
                        //Match previous and next links.

                        // store links to pages against the page they link to for processing later.
                        if ( match[2] == 'next') {
                            if(context.next_page) {
                                page_request = context.pages[ context.next_page ];
                            }

                            $this.on('click.prevNext',  onClickNextLink);

                        } else if ( match[2] == 'previous') {
                            if(context.previous_page) {
                                page_request = context.pages[context.previous_page];
                            }

                            $this.on('click.prevNext', onClickPrevLink);

                        }

                        if (page_request) {
                            page_request.links_to_page.push($this);
                        } else {
                            $this.on('click.navLink', onClickNotAllowed);
                        }




                    } else if ( match = re3.exec( url )) {
                    //Match internal links.
                        $this
                            .off('.internalLink')
                            .attr('target', '')
                            .data('link', match[2])
                            .on('click.internalLink', onClickInternalLink);
                    } else {
                        // other links open in a new window
                        //we must add a click event as some links are <buttons>
                        $this.off('click.extLink')
                        .on('click.extLink', function(ev) { 
                            ev.preventDefault();
                            window.open(url, '_blank');
                        }); 
                    }
                }

            });
        }   
    });
        
})(jQuery);

(function($){
    $.fn.extend({
        fix_titles: function( $context ) {
        
            //Settings list and the default values
            //var defaults = {};
            //var options = $.extend(defaults, options);
            
            return this.each(function() {
                
                //="modal"  data-toggle="tab" data-slide="prev"  data-toggle="collapse");

                var $item = $(this);

                if (!$item.attr('title') || !$item.attr('title').length) {
                    
                    var toggle = $item.attr('data-toggle');

                    // MODALS
                    if (toggle == 'modal') {
                        // title, if not set, should 
                        var href = $item.attr('href');
                        
                        if (href && href.length) {
                            // modals are linked with the href (which will be a full id)
                            var $linked_modal = $context.find( href );
                            var title = '';
                            var $title_element;

                            if ($linked_modal.length) {
                                // if the modal is set up right, then it will have aria-labelledby, which is an id
                                if ( $linked_modal.attr('aria-labelledby') )
                                    $title_element = $linked_modal.find('#'+$linked_modal.attr('aria-labelledby'));
                                // otherwise just dive for the first H tag
                                if (!title.length)
                                    $title_element = $linked_modal.find('h1,h2,h3,h4,h5').first();
                            }

                            if ($title_element && $title_element.length) {
                                var cloned_title_element = $title_element.clone();
                                cloned_title_element.find("br").replaceWith(" ");
                                title = cloned_title_element.text();
                            }

                            if (title.length)
                                $item.attr('title', title);
                            else
                                $item.attr('title', 'Open a popup with more information');
                        }
                    // COLLAPSE / ACCORDIAN
                    } else if (toggle == 'collapse' || toggle == 'tab' || toggle == 'collapse-next') {
                        // to a screen reader, the accordians and tabs are all visible already, so the links are just anchors
                        // http://stackoverflow.com/questions/11905943/jquery-text-interpretbr-as-new-line
                        $item.attr('title', $item.get(0).innerText || $item.get(0).textContent);

                    } else if ($item.attr('data-slide') == 'next') {
                        $item.attr('title', 'Proceed to the next slide');

                    } else if ($item.attr('data-slide') == 'prev') {
                        $item.attr('title', 'Go back to the previous slide');

                    }

                }


            });
        }   
    });
        
})(jQuery);


(function($){


	function moveNext() {

        var $page_content = $('#paw');
        var $pew = $('#pew');

        // if we have tabs, we should move on to the next tab if there is one
        var $tabs = $page_content.find( 'ul.nav-tabs');
        if ( $tabs.length ) {
            var $next_tab = $tabs.find('li.active').next('li');
            if ( $next_tab.length ) {
                $next_tab.find('a:first').trigger('click');
                return;
            }
        }

        // if we are the carousel, we should move on to the next screen, if there is one
        var $carousel = $page_content.find( 'div.carousel');
        if ( $carousel.length ) {
            var $next_screen = $carousel.find('div.item.active').next('div.item');
            if ( $next_screen.length ) {
                $page_content.find('[data-slide=next]').trigger('click');
                return;
            }
        }

        // otherwise we should attempt to go to the next page
        $('[data-role=pager-next] a', $pew).not( "[style='visibility:hidden']" ).trigger('click');

    }

    function movePrev() {

        var $page_content = $('#paw');
        var $pew = $('#pew');

        // if we have tabs, we should move on to the next tab if there is one
        var $tabs = $page_content.find( 'ul.nav-tabs');
        if ( $tabs.length ) {
            var $prev_tab = $tabs.find('li.active').prev('li');
            if ( $prev_tab.length ) {
                $prev_tab.find('a:first').trigger('click');
                return;
            }
        }

        // if we are the carousel, we should move on to the next screen, if there is one
        var $carousel = $page_content.find( 'div.carousel');
        if ( $carousel.length ) {
            var $prev_screen = $carousel.find('div.item.active').prev('div.item');
            if ( $prev_screen.length ) {
                $page_content.find('[data-slide=prev]').trigger('click');
                return;
            }
        }

        // otherwise we should attempt to go to the previous page
        $('[data-role=pager-previous] a', $pew).not( "[style='visibility:hidden']" ).trigger('click');

    }

    $.fn.extend({
        gestures: function(options) {

	    	if ($.fn.gestures.defaults.enabled) {
	            // disable or enable
	            if (options === 'disable') {
					return this.each(function() {
	            		$(this).swipe('disable');
	            	});
	            } else if (options === 'enable') {
					return this.each(function() {
	            		$(this).swipe('enable');
	            	});
				}
			}

            // otherwise lets do defaults
            //var defaults = {};
            //var options = $.extend(defaults, options);
            
            return this.each(function() {
                // only do on touch event (enables text highlighting for copy&paste)
                $(document).on("touchstart",function(event) {
	        	     // only do if turned on
    	    		if ($.fn.gestures.defaults.enabled) {

    	    		    var textDirection = 'ltr';
    	    		    var $body = $('body');

    	    		    if(document.dir === 'rtl' || $('html').attr('dir') === 'rtl' || $body.attr('dir') === 'rtl' || $('#__body__moved').attr('dir') === 'rtl') {
    	    		        textDirection = 'rtl'
                        }

    	            	$(this).swipe({
    	            		excludedElements: '.e-c,button,a,input,textarea,.e-mejs-player,.e-slider', //,input.learner_input, textarea.learner_input// exclude elements that are going to be commented on (library conflicts with swiping in IE10/11)
                            isScrolling: false,
                            scrollPos: 0,
                            scrollThreshold: 10,
                            swipeStatus: function(event, phase) {
    	            		    var currentScrollPos = $body.scrollTop();
    	            		    var self = this;
    	            		    var scrollThreshold = 10;
    	            		    if(phase === 'start') {
    	            		        self.scrollPos = currentScrollPos;
    	            		        self.isScrolling = false;
                                } else if(phase === 'end') {
    	            		        if(Math.abs(self.scrollPos - currentScrollPos) > scrollThreshold) {
    	            		            self.isScrolling = true;
                                    }
                                }
                            },
                            swipe: function(event, direction){
    	            		    var self = this;
    	            		    //If scrolling is detected, don't trigger the swipe.
    	            		    if(self.isScrolling) {
    	            		        return true;
                                }
                                switch(direction) {
                                    case 'left' :
                                        textDirection === 'rtl' ? movePrev() : moveNext();
                                        break;
                                    case 'right' :
                                        textDirection === 'rtl' ? moveNext() : movePrev();
                                        break;
                                }
                            },
    			        	threshold:150,
    	          			maxTimeThreshold:700,
                            allowPageScroll: "vertical"
    			    	});

    				}
                });
            });
        }   
        
    });

    //Settings list and the default values
    $.fn.gestures.defaults = {
        enabled: !$('body').hasClass('preview_commenting')
    };
        
})(jQuery);

(function($){

    $.fn.extend({
        modal_show: function(options) {
        
            //Settings list and the default values
            var defaults = {};
            var options = $.extend(defaults, options);
            
            return this.each(function() {
                
                var $this = $(this);
                // if we have the class 'modal', we'll call modal('show')
                // else we'll do a manual show (and hide others)
                if ( $this.attr('data-mode') == 'dropdown' ) {
                    // we'll use the dropdown method instead
                    $this.siblings('[data-mode="dropdown"]').removeClass('open').attr('aria-hidden',true);
                    $this.addClass('open').attr('aria-hidden',false);
                    
                } else {
                    $this.modal('show');

                }
            });
        },
        modal_destroy: function(options) {
            //Settings list and the default values
            var defaults = {};
            var options = $.extend(defaults, options);
            
            return this.each(function() {
                var $this = $(this);
                // put back where we got it from
                if ($this.data('parent'))
                    $this.appendTo( $this.data('parent') );
                // kill hidden action
                $this.off('modal-hidden');
            });
        }   
    });
        
})(jQuery);


(function($){
    $.fn.extend({
        randomize: function() {
            var $this = $(this);
            var order_before = [];
            $this.children().each(function () {
                var $c = $(this);
                order_before.push ( $c.get(0).nodeName+'|'+$c.attr('id')+'|'+$c.attr('class'));
            });
            $this.children().sort(function(){
                return Math.round(Math.random()) - 0.5;
            }).remove().appendTo(this);
            var order_after = [];
            $this.children().each(function () {
                var $c = $(this);
                order_after.push ( $c.get(0).nodeName+'|'+$c.attr('id')+'|'+$c.attr('class'));
            });
            if (!order_before.length || order_before.join(',') != order_after.join(','))
                return this;
            else
                return this.randomize();
        }
    });

})(jQuery);
(function($){
    $.fn.extend({
        tab_fixer: function() {
            return this.each(function() {
                var $link = $(this);
                // make sure if there are active tabs - we turn them off
                if ( !$link.closest( '.add-option-template' ).length ) {
                    var tab_href = $link.attr('href');
                    if (tab_href) {
                        var $tab_pane = $(tab_href);
                        if ($tab_pane.length) {
                            if ($tab_pane.is(':first-child'))
                                $link.tab('show');
                            else
                                // make sure first has active - and others are turned off
                                $tab_pane.removeClass('active');
                        }
                    }
                }
            });
        }
    });
})(jQuery);

Number.prototype.between = function(lower,upper) {
    if (this > upper) return upper;
    if (this < lower) return lower;
    return this;
};String.prototype.reverse=function(){
	return this.split("").reverse().join("");
};
var waitForFinalEvent = (function () {
    var timers = {};
    return function (callback, ms,uniqueId) {
        if (timers[uniqueId]) {
            clearTimeout (timers[uniqueId]);
        }
        timers[uniqueId] = setTimeout(callback, ms);
    };
})();


$('body').on('elucidat.page.ready', function (event, page_data, $new_page) {
    
    var $projectHeader = $('.project__header');
    var $projectFooter = $('.project__footer');
    
    // find sticky elements other than the header
    var $stickyElements = $('.e-pos--sticky:not(.project__header)');
    
    // check fixed header height to compensate
    var stickyOffset = 0;
    var topMargin = 0;
    var botMargin = 0;
    
    
    function checkHeight($element) {
        if ($element && $element.length) {
            if ($element.hasClass('e-pos--fixed') || $element.hasClass('e-pos--sticky') ) {
                return $element.height();
            }
        }
        return 0;
    }
    
    function checkMargins( el ) {
        topMargin = parseInt(el.css('margin-top'));
        botMargin = parseInt(el.css('margin-bottom'));
    }
    
    if ($stickyElements.length) {
        // check if header has fixed position
        var headerHeight = checkHeight($projectHeader);
        var footerHeight = checkHeight($projectFooter);
        
        $stickyElements.each(function (i) {
            var $element = $(this);
            
            checkMargins( $element );
            
            $element.sticky({
                topSpacing: stickyOffset + topMargin
            });
            
            // prevent parent element from collapsing when the height changed
            // prevents the scroll from jumping
            $element.css({
                'margin-top': 0,
                'margin-bottom': 0
            });
            $element.parent().css({
                'min-height': $element.outerHeight(),
                'margin-top': topMargin,
                'margin-bottom': botMargin
            });
            
            
            $element.on('sticky-start', function() {
                $element.css({
                    'margin-top': 0,
                    'border-top-left-radius': topMargin ? '' : 0,
                    'border-top-right-radius': topMargin ? '' : 0
                });
                
                if ( i === 0 ) {
                    // console.log('no previous element');
                    return;
                } else {
                    // console.log('time to end ' + (i-1));
                    $($stickyElements[i-1]).hide();
                }
                
            }).on('sticky-end', function() {
                $element.css({'margin-top': '', 'border-top-left-radius': '', 'border-top-right-radius': ''});
                $($stickyElements[i-1]).show();
            });

            $(window).resize(function () {
                var elementHeight = $element.outerHeight();
                $element.parent().css({
                    'height': elementHeight,
                    'min-height': elementHeight
                });
            })
            
            
            // progress indicator specific
            if ($element.hasClass('progressIndicator')) {
                
                var $indicator_header = $element.find('.progressIndicator__header');
                var $indicator_body = $element.find('.progressIndicator__body');

                $element.find('.dropdown__toggle').click(function () { 
                    $element.parent().css({
                        'min-height': '', 
                        'height': ''
                    });
                    setTimeout(function() { 
                        if($indicator_header.hasClass('open')) { 
                            // make sure the body of the dropdown is not bigger than the window
                            var windown_height = $(window).height();
                            var indicatorOffset = $element[0].getBoundingClientRect().top;
                            var indicator_header_height = $indicator_header.is(':visible') ? $indicator_header.outerHeight() : 0;
                            var indicator_body_max_height = windown_height - indicatorOffset - indicator_header_height - headerHeight - footerHeight - 10;
                            
                            $indicator_body.css('max-height', indicator_body_max_height)
                            $element.css({'border-bottom-left-radius': 0, 'border-bottom-right-radius': 0});
                        } else { 
                            $element.parent().css('height', $indicator_header.outerHeight());
                        }
                    }, 10);
                });
                
            }
        });
    }
    
    (function () {
        // Javascript to help with the repeating sections
        // The skin value changes the z-index in the css
        // we can then use that z-index value to know how many repeating sections to use
        // absolute spaghetti i know but this is because we can't add/remove classes usings the styles so this is a work around
        // the file that does the same thing in author can be find in > javascript/app/project_editing_iframe/init/31_page_sections.js
        var $page_sections = $('.page-section');
        var $section_helper = $('<span class="section-helper"></span>');
        
        $section_helper.appendTo( $('body').find('#pew') );
        var section_helper_num = $section_helper.css('zIndex');
        $section_helper.remove();
        
        $('body').find('.template_wrapper').addClass('e-repeat-pattern--'+section_helper_num);
    })();
});
var ElucidatPlugin = function() {

};

ElucidatPlugin.prototype.init = function(beforeEvents, afterEvents) {
    if(typeof beforeEvents === 'function') {
        beforeEvents();
    }
    this.initEvents();
    if(typeof afterEvents === 'function') {
        afterEvents();
    }

};


ElucidatPlugin.prototype.initEvents = function() {
    var self = this;

    $(document).on('elucidat.navigation.loaded', function (event, data) {
        self.navigationLoadedEvents(event, data);
        self.allEvents(event, data);
    });

    $(document).on('elucidat.navigation.not_allowed', function (event, data) {
        self.navigationNotAllowedEvents(event, data);
        self.allEvents(event, data);
    });
    
    $(document).on('elucidat.navigation.error', function (event, data) {
        self.navigationErrorEvents(event, data);
        self.allEvents(event, data);
    });

    $(document).on('elucidat.page.change', function (event, data) {
        self.pageChangeEvents(event, data);
        self.allEvents(event, data);
    });

    $(document).on('elucidat.page.open', function (event, data) {
        self.pageOpenEvents(event, data);
        self.allEvents(event, data);
    });

    $(document).on('elucidat.page.ready', function (event, data) {
        self.pageReadyEvents(event, data);
        self.allEvents(event, data);
    });

    $(document).on('elucidat.page.complete', function (event, data) {
        self.pageCompleteEvents(event, data);
        self.allEvents(event, data);
    });

    $(document).on('elucidat.progress', function (event, data) {
        self.progressEvents(event, data);
        self.allEvents(event, data);
    });

    $(document).on('elucidat.achievement', function (event, data) {
        self.achievementEvents(event, data);
        self.allEvents(event, data);
    });
};

ElucidatPlugin.prototype.navigationLoadedEvents = function(event, data) {

};

ElucidatPlugin.prototype.navigationNotAllowedEvents = function(event, data) {

};

ElucidatPlugin.prototype.navigationErrorEvents = function(event, data) {

};

ElucidatPlugin.prototype.pageChangeEvents = function(event, data) {

};

ElucidatPlugin.prototype.pageOpenEvents = function(event, data) {

};

ElucidatPlugin.prototype.pageReadyEvents = function(event, data) {

};

ElucidatPlugin.prototype.pageCompleteEvents = function(event, data) {

};

ElucidatPlugin.prototype.progressEvents = function(event, data) {

};

ElucidatPlugin.prototype.achievementEvents = function(event, data) {

};

ElucidatPlugin.prototype.allEvents = function(event, data) {

};

ElucidatPlugin.prototype.getLanguageString = function(iso, defaultLang) {

    if(!iso) { iso = 'ietf'}
    if(!defaultLang) { defaultLang = 'en-GB'}

    //Can pass in `iso` to return various different iso formats e.g. `iso-659-1` or whatever,
    // and a defaultLang in case the localisation endpoint has no data.

    var lang = defaultLang;

    //In preview language information is not available ¯\_(ツ)_/¯
    if(endpoint.localisation && endpoint.localisation.language) {
        var lang = endpoint.localisation.language[iso];
    }
    return lang;
};


// var ElucidatPlugin = new ElucidatPlugin();
