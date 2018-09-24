Vue.component("transitionexpandwidth", {
    template: '<transition name="transitionExpandWidth" @enter="enter" @after-enter="afterEnter" @leave="leave" ><slot/></transition>',
    props: {
        time: {
            default: "0.5",
            type: String
        }
    },
    methods: {
        setStyle(element) {
            element.style.transition = "width " + this.time + "s cubic-bezier(.25, .8, .25, 1)"
            element.style.overflow = "hidden"
            element.style.textOverflow = "clip"
            element.style.whiteSpace = "nowrap"
        },
        enter(element) {
            this.setStyle(element)
            const height = getComputedStyle(element).height;
            element.style.height = height;
            element.style.position = 'absolute';
            element.style.visibility = 'hidden';
            element.style.width = 'auto';

            const width = getComputedStyle(element).width;
            element.style.height = null;
            element.style.position = null;
            element.style.visibility = null;
            element.style.width = 0;
            setTimeout(() => {
                element.style.width = width;
            }, 50);
        },
        afterEnter(element) {
            element.style.width = 'auto';
            element.style.overflow = "initial"
        },
        leave(element) {
            this.setStyle(element)
            const width = getComputedStyle(element).width;
            element.style.width = width;
            setTimeout(() => {
                element.style.width = 0;
            }, 50);
        },
    },
})