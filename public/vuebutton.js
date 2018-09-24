Vue.component("vuebutton", {
    props: {
        loading: { type: Boolean, default: false },
        disabled: { type: Boolean, default: false },
        text: { type: String }
    },
    template: `
<span>
    <div class="vuebutton" :class="{disabled: disabled}" @click="$emit(\'click\')">
        <transitionexpandwidth>
            <span v-if="loading">
                <svg class="loadingIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
                    <rect x="15" y="15" width="30" height="30" rx="2" ry="2" id="blue">
                        <animate id="x" attributeName="x" calcMode="linear" values="15;55;55;55;55;15;15;15;15" keyTimes="0;0.083;0.25;0.333;0.5;0.583;0.75;0.833;1" dur="1.6" begin="-1.4666666666666668s" repeatCount="indefinite"></animate>
                        <animate attributeName="y" calcMode="linear" values="15;55;55;55;55;15;15;15;15" keyTimes="0;0.083;0.25;0.333;0.5;0.583;0.75;0.833;1" dur="1.6" begin="-1.0666666666666667s" repeatCount="indefinite"></animate>
                    </rect>
                    <rect x="15" y="55" width="30" height="30" rx="2" ry="2" id="pink">
                        <animate attributeName="x" calcMode="linear" values="15;55;55;55;55;15;15;15;15" keyTimes="0;0.083;0.25;0.333;0.5;0.583;0.75;0.833;1" dur="1.6" begin="-0.9333333333333335s" repeatCount="indefinite"></animate>
                        <animate attributeName="y" calcMode="linear" values="15;55;55;55;55;15;15;15;15" keyTimes="0;0.083;0.25;0.333;0.5;0.583;0.75;0.833;1" dur="1.6" begin="-0.5333333333333333s" repeatCount="indefinite"></animate>
                    </rect>
                    <rect x="55" y="30" width="30" height="30" rx="2" ry="2" id="orange">
                        <animate attributeName="x" calcMode="linear" values="15;55;55;55;55;15;15;15;15" keyTimes="0;0.083;0.25;0.333;0.5;0.583;0.75;0.833;1" dur="1.6" begin="-0.4s" repeatCount="indefinite"></animate>
                        <animate attributeName="y" calcMode="linear" values="15;55;55;55;55;15;15;15;15" keyTimes="0;0.083;0.25;0.333;0.5;0.583;0.75;0.833;1" dur="1.6" begin="0s" repeatCount="indefinite"></animate>
                    </rect>
                </svg>
            </span>
        </transitionexpandwidth>
        <transitionexpandwidth>
            <div v-if="!loading"><p>{{text}}</p></div>
        </transitionexpandwidth>
    </div>
</span>`,
})