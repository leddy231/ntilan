Vue.component("transitionexpandheight", {
    template: '<transition name="transitionExpandHeight" @enter="enter" @after-enter="afterEnter" @leave="leave" ><slot/></transition>',
    props: {
        time: {
            default: "0.5",
            type: String
        }
    },
    methods: {
        setStyle(element) {
            element.style.transition = "height " + this.time + "s cubic-bezier(.25, .8, .25, 1)"
            element.style.overflow = "hidden"
        },
        enter(element) {
            this.setStyle(element)
            const width = getComputedStyle(element).width;
            element.style.width = width;
            element.style.position = 'absolute';
            element.style.visibility = 'hidden';
            element.style.height = 'auto';

            const height = getComputedStyle(element).height;
            element.style.width = null;
            element.style.position = null;
            element.style.visibility = null;
            element.style.height = 0;

            setTimeout(() => {
                element.style.height = height;
            }, 50);
        },
        afterEnter(element) {
            element.style.height = 'auto';
            element.style.overflow = "initial"
        },
        leave(element) {
            this.setStyle(element)
            const height = getComputedStyle(element).height;
            element.style.height = height;
            setTimeout(() => {
                element.style.height = 0;
            }, 50);
        },
    },
})