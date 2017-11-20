import * as React from 'react';

const Icon = (path: string) => (props: any) => <img src={path} {...props} />;

export const CloseIcon = Icon('/img/close.svg');

export const ContactIcon = Icon('/img/contact.svg');

export const DiscourseIcon = Icon('/img/discourse.svg');

export const DownloadIcon = (props: any) => (
  <svg width="15px" height="16px" viewBox="0 0 15 16">
    <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <g fill="#000000">
        <path d="M0.99609375,4.11035156 C1.66992524,2.95800205 2.58300205,2.04736663 3.73535156,1.37841797 C4.88770107,0.709469312 6.14257134,0.375 7.5,0.375 C8.85742866,0.375 10.1122989,0.709469312 11.2646484,1.37841797 C12.4169979,2.04736663 13.3276334,2.95800205 13.996582,4.11035156 C14.6655307,5.26270107 15,6.51757134 15,7.875 C15,9.23242866 14.6655307,10.4872989 13.996582,11.6396484 C13.3276334,12.7919979 12.4169979,13.7026334 11.2646484,14.371582 C10.1122989,15.0405307 8.85742866,15.375 7.5,15.375 C6.14257134,15.375 4.88770107,15.0405307 3.73535156,14.371582 C2.58300205,13.7026334 1.67236663,12.7919979 1.00341797,11.6396484 C0.334469312,10.4872989 0,9.23242866 0,7.875 C0,6.51757134 0.33202793,5.26270107 0.99609375,4.11035156 Z M13.5498047,5.32617188 C13.2080061,4.51562095 12.7417022,3.81738574 12.1508789,3.23144531 C11.5600556,2.64550488 10.8593791,2.17920095 10.0488281,1.83251953 C9.2382772,1.48583811 8.38867632,1.3125 7.5,1.3125 C6.61132368,1.3125 5.7617228,1.48583811 4.95117188,1.83251953 C4.14062095,2.17920095 3.44238574,2.64550488 2.85644531,3.23144531 C2.27050488,3.81738574 1.80420095,4.51562095 1.45751953,5.32617188 C1.11083811,6.1367228 0.9375,6.98632368 0.9375,7.875 C0.9375,8.76367632 1.11083811,9.6132772 1.45751953,10.4238281 C1.80420095,11.2343791 2.27050488,11.9326143 2.85644531,12.5185547 C3.44238574,13.1044951 4.14062095,13.570799 4.95117188,13.9174805 C5.7617228,14.2641619 6.61132368,14.4375 7.5,14.4375 C8.38867632,14.4375 9.2382772,14.2641619 10.0488281,13.9174805 C10.8593791,13.570799 11.5600556,13.1044951 12.1508789,12.5185547 C12.7417022,11.9326143 13.2104475,11.2343791 13.5571289,10.4238281 C13.9038103,9.6132772 14.0771484,8.76367632 14.0771484,7.875 C14.0771484,6.98632368 13.9013689,6.1367228 13.5498047,5.32617188 Z M7.03125,4.59375 C7.03125,4.52539028 7.04345691,4.46191436 7.06787109,4.40332031 C7.09228528,4.34472627 7.12402324,4.29589863 7.16308594,4.25683594 C7.20214863,4.21777324 7.25097627,4.18603528 7.30957031,4.16162109 C7.36816436,4.13720691 7.43164028,4.125 7.5,4.125 C7.62695376,4.125 7.73681594,4.16894487 7.82958984,4.25683594 C7.92236375,4.344727 7.96875,4.45703057 7.96875,4.59375 L7.96875,9.89648438 L9.68261719,8.16796875 C9.78027393,8.08007769 9.89257749,8.03613281 10.0195312,8.03613281 C10.146485,8.03613281 10.2563472,8.08251907 10.3491211,8.17529297 C10.441895,8.26806687 10.4882812,8.37792905 10.4882812,8.50488281 C10.4882812,8.63183657 10.4443364,8.74414014 10.3564453,8.84179688 L7.51464844,11.6103516 L4.67285156,8.84179688 C4.64355454,8.81249985 4.61914072,8.77832051 4.59960937,8.73925781 C4.47265562,8.53417866 4.49706943,8.34375088 4.67285156,8.16796875 C4.70214858,8.13867173 4.73388655,8.11425791 4.76806641,8.09472656 C4.80224626,8.07519521 4.83886699,8.06054692 4.87792969,8.05078125 C4.91699238,8.04101558 4.95605449,8.03613281 4.99511719,8.03613281 C5.03417988,8.03613281 5.07324199,8.04101558 5.11230469,8.05078125 C5.15136738,8.06054692 5.19042949,8.07519521 5.22949219,8.09472656 C5.26855488,8.11425791 5.30273423,8.13867173 5.33203125,8.16796875 L7.03125,9.8671875 L7.03125,4.59375 Z" />
      </g>
    </g>
  </svg>
);

export const GithubIcon = Icon('/img/github.svg');

export const MenuIcon = ({ className = '', ...props }: any) => (
  <svg className={'menu-icon ' + className} width="10" height="10" {...props}>
    <rect className="left" x="4" y="0" width="2" height="2" />
    <rect className="right" x="4" y="0" width="2" height="2" />
    <rect x="4" y="4" width="2" height="2" />
    <rect className="left" x="4" y="8" width="2" height="2" />
    <rect className="right" x="4" y="8" width="2" height="2" />
  </svg>
);

export const PlayIcon = (props: any) => (
  <svg viewBox="0 0 13 15" {...props}>
    <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <g id="icon-/-play" fill="#B7D43F">
        <path
          d="M0.978009259,0 C1.03819475,0 1.09587164,0.00733847847 1.15104167,0.0220156556 C1.2062117,0.0366928327 1.2613809,0.0538159491 1.31655093,0.0733855186 C1.37172095,0.0929550881 1.42438247,0.117416683 1.47453704,0.146771037 L12.5486111,6.7074364 C12.6388893,6.75636032 12.7191355,6.82240663 12.7893519,6.9055773 C12.8595683,6.98874797 12.9122298,7.08170203 12.947338,7.18444227 C12.9824462,7.28718251 13,7.39236737 13,7.5 C13,7.85225225 12.8495385,8.11643748 12.5486111,8.2925636 L1.45949074,14.853229 C1.38927434,14.9021529 1.31153592,14.9388453 1.22627315,14.9633072 C1.14101038,14.9877692 1.05324119,15 0.962962963,15 C0.882715648,15 0.802469537,14.9902154 0.722222222,14.9706458 C0.641974907,14.9510762 0.566744178,14.9217223 0.496527778,14.8825832 C0.165507604,14.6966723 0,14.4227024 0,14.0606654 L0.0150462963,0.939334638 C0.0150462963,0.577297603 0.1805539,0.30332774 0.511574074,0.11741683 C0.652006875,0.0391385519 0.807483715,0 0.978009259,0 Z"
          id="play-button"
        />
      </g>
    </g>
  </svg>
);

export const RedoIcon = (props: any) => (
  <svg>
    <g strokeWidth="1" fill="none" fillRule="evenodd">
      <g fill="#000000">
        <path d="M28.5714626,3.19044781 C28.5714626,2.70681628 28.2738432,2.27898839 27.8460153,2.09297626 C27.3995862,1.90696413 26.8787523,1.9999702 26.5439305,2.35339324 L24.1257728,4.75294967 C21.5030018,2.27898839 17.9501702,0.809492588 14.2857313,0.809492588 C6.41741836,0.809492588 0,7.22691095 0,15.0952239 C0,22.9635369 6.41741836,29.3809552 14.2857313,29.3809552 C18.545409,29.3809552 22.5632709,27.5022327 25.279048,24.2284193 C25.4650601,23.9866036 25.4650601,23.6331805 25.2418456,23.4285672 L22.6934794,20.8615998 C22.5632709,20.7499925 22.39586,20.6941889 22.2284491,20.6941889 C22.0610382,20.7127901 21.8936273,20.787195 21.8006212,20.9174035 C19.9777024,23.2797575 17.2433241,24.6190448 14.2857313,24.6190448 C9.04018935,24.6190448 4.76191044,20.3407659 4.76191044,15.0952239 C4.76191044,9.84968194 9.04018935,5.57140303 14.2857313,5.57140303 C16.7224902,5.57140303 19.0290405,6.50146366 20.7775545,8.11976916 L18.2105872,10.6867365 C17.8571641,11.0215583 17.7641581,11.5423923 17.9501702,11.9702202 C18.1361823,12.4166493 18.5640102,12.7142687 19.0476418,12.7142687 L27.380985,12.7142687 C28.0320275,12.7142687 28.5714626,12.1748335 28.5714626,11.5237911 L28.5714626,3.19044781 Z" />
      </g>
    </g>
  </svg>
);

export const RecordIcon = Icon('/img/record.svg');

export const SuccessIcon = Icon('/img/success.svg');

export const SupportIcon = Icon('/img/support.svg');

const FONT_ICONS = {
  chrome: '',
  facebook: '',
  firefox: '',
  link: '',
  pause: '',
  stop: '',
  twitter: '',
  undo: '',
};

interface FontIconProps {
  [key: string]: any;
  type: keyof typeof FONT_ICONS;
}

export const FontIcon = ({ type, ...props }: FontIconProps) => (
  <span aria-hidden="true" data-icon={FONT_ICONS[type]} {...props} />
);
