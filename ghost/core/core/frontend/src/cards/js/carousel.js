(function () {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
    }

    const AUTOPLAY_INTERVAL = 5000;
    const INTERACTION_PAUSE = 7000;
    const supportsVisibility = typeof document.visibilityState !== 'undefined';

    const passiveIfSupported = (function () {
        let supportsPassive = false;
        try {
            const options = Object.defineProperty({}, 'passive', {
                get: function () {
                    supportsPassive = true;
                }
            });
            const noop = function () {};
            window.addEventListener('testPassive', noop, options);
            window.removeEventListener('testPassive', noop, options);
        } catch (e) {
            supportsPassive = false;
        }
        return supportsPassive ? {passive: true} : false;
    })();

    const toArray = function (list) {
        return Array.prototype.slice.call(list);
    };

    const carouselCards = document.querySelectorAll('.kg-carousel-card');
    if (!carouselCards.length) {
        return;
    }

    toArray(carouselCards).forEach(setupCarousel);

    function setupCarousel(card) {
        const container = card.querySelector('.kg-carousel-container');
        const items = toArray(card.querySelectorAll('.kg-carousel-item'));

        if (!container || items.length <= 1) {
            return;
        }

        const dots = toArray(card.querySelectorAll('[data-kg-carousel-dot]'));
        const prevControl = card.querySelector('[data-kg-carousel-prev]');
        const nextControl = card.querySelector('[data-kg-carousel-next]');
        const videos = toArray(card.querySelectorAll('video'));
        const playingVideos = new Set();
        const supportsSmoothScroll = 'scrollBehavior' in document.documentElement.style;
        const ACTIVE_ITEM_CLASS = 'is-active';

        let currentIndex = getClosestIndex();
        let scrollRaf = null;
        let autoplayTimer = null;
        let interactionTimeout = null;

        const pauseState = {
            hover: false,
            interaction: false,
            video: false,
            visibility: supportsVisibility ? document.visibilityState === 'hidden' : false
        };

        function setPause(reason, value) {
            if (pauseState[reason] === value) {
                return;
            }
            pauseState[reason] = value;
            updateAutoplay();
        }

        function shouldAutoplay() {
            return !pauseState.hover && !pauseState.interaction && !pauseState.video && !pauseState.visibility;
        }

        function updateAutoplay() {
            if (shouldAutoplay()) {
                if (!autoplayTimer) {
                    autoplayTimer = window.setInterval(function () {
                        goToSlide(currentIndex + 1);
                    }, AUTOPLAY_INTERVAL);
                }
            } else if (autoplayTimer) {
                window.clearInterval(autoplayTimer);
                autoplayTimer = null;
            }
        }

        function pauseForInteraction() {
            setPause('interaction', true);
            if (interactionTimeout) {
                window.clearTimeout(interactionTimeout);
            }
            interactionTimeout = window.setTimeout(function () {
                setPause('interaction', false);
            }, INTERACTION_PAUSE);
        }

        function getClosestIndex() {
            const containerRect = container.getBoundingClientRect();
            let closest = 0;
            let minDistance = Infinity;

            items.forEach(function (item, index) {
                const itemRect = item.getBoundingClientRect();
                const distance = Math.abs(itemRect.left - containerRect.left);
                if (distance < minDistance) {
                    minDistance = distance;
                    closest = index;
                }
            });

            return closest;
        }

        function getOffsetForItem(item) {
            const containerRect = container.getBoundingClientRect();
            const itemRect = item.getBoundingClientRect();
            return container.scrollLeft + (itemRect.left - containerRect.left);
        }

        function goToSlide(index, behavior) {
            const total = items.length;
            const targetIndex = (index % total + total) % total;
            const target = items[targetIndex];
            if (!target) {
                return;
            }

            const offset = getOffsetForItem(target);
            if (supportsSmoothScroll) {
                container.scrollTo({
                    left: offset,
                    behavior: behavior || 'smooth'
                });
            } else {
                container.scrollLeft = offset;
            }

            currentIndex = targetIndex;
            setActiveDot(targetIndex);
            setActiveItem(targetIndex);
            stopVideosOutsideActive(targetIndex);
        }

        function setActiveDot(index) {
            if (!dots.length) {
                return;
            }

            dots.forEach(function (dot, dotIndex) {
                const isActive = dotIndex === index;
                if (isActive) {
                    dot.classList.add('is-active');
                    dot.setAttribute('aria-current', 'true');
                } else {
                    dot.classList.remove('is-active');
                    dot.removeAttribute('aria-current');
                }
            });
        }

        function setActiveItem(index) {
            items.forEach(function (item, itemIndex) {
                if (itemIndex === index) {
                    item.classList.add(ACTIVE_ITEM_CLASS);
                } else {
                    item.classList.remove(ACTIVE_ITEM_CLASS);
                }
            });
        }

        function stopVideosOutsideActive(activeIndex) {
            items.forEach(function (item, itemIndex) {
                if (itemIndex === activeIndex) {
                    return;
                }

                const itemVideos = item.querySelectorAll('video');
                for (let i = 0; i < itemVideos.length; i++) {
                    const video = itemVideos[i];
                    if (!video.paused) {
                        video.pause();
                    }
                    playingVideos.delete(video);
                }
            });

            if (playingVideos.size === 0) {
                setPause('video', false);
            }
        }

        function handleScroll() {
            if (scrollRaf) {
                return;
            }
            scrollRaf = window.requestAnimationFrame(function () {
                scrollRaf = null;
                const nextIndex = getClosestIndex();
                if (nextIndex !== currentIndex) {
                    currentIndex = nextIndex;
                    setActiveDot(nextIndex);
                    setActiveItem(nextIndex);
                    stopVideosOutsideActive(nextIndex);
                }
            });
        }

        function handleVideoPlay(event) {
            playingVideos.add(event.currentTarget);
            setPause('video', playingVideos.size > 0);
        }

        function handleVideoPause(event) {
            playingVideos.delete(event.currentTarget);
            if (playingVideos.size === 0) {
                setPause('video', false);
            }
        }

        container.addEventListener('scroll', handleScroll);
        container.addEventListener('pointerdown', pauseForInteraction);
        container.addEventListener('touchstart', pauseForInteraction, passiveIfSupported);
        container.addEventListener('wheel', pauseForInteraction, passiveIfSupported);

        card.addEventListener('mouseenter', function () {
            setPause('hover', true);
        });
        card.addEventListener('mouseleave', function () {
            setPause('hover', false);
        });

        if (prevControl) {
            prevControl.addEventListener('click', function (event) {
                event.preventDefault();
                goToSlide(currentIndex - 1);
                pauseForInteraction();
            });
        }

        if (nextControl) {
            nextControl.addEventListener('click', function (event) {
                event.preventDefault();
                goToSlide(currentIndex + 1);
                pauseForInteraction();
            });
        }

        dots.forEach(function (dot, dotIndex) {
            dot.addEventListener('click', function (event) {
                event.preventDefault();
                const targetAttr = parseInt(dot.getAttribute('data-index'), 10);
                const target = isNaN(targetAttr) ? dotIndex : targetAttr;
                goToSlide(target);
                pauseForInteraction();
            });
        });

        videos.forEach(function (video) {
            video.addEventListener('play', handleVideoPlay);
            video.addEventListener('pause', handleVideoPause);
            video.addEventListener('ended', handleVideoPause);
        });

        if (supportsVisibility) {
            document.addEventListener('visibilitychange', function () {
                setPause('visibility', document.visibilityState === 'hidden');
            });
        }

        currentIndex = getClosestIndex();
        setActiveDot(currentIndex);
        setActiveItem(currentIndex);
        stopVideosOutsideActive(currentIndex);
        updateAutoplay();
    }
})();
