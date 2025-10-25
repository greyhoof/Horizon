<template>
  <div :class="wrapClass" @focusout="blur">
    <slot name="split"></slot>
    <a
      :class="linkClass"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      @click.prevent="isOpen = !isOpen"
      href="#"
      :style="linkStyle"
      role="button"
      tabindex="-1"
      ref="buttonRef"
    >
      <i :class="iconClass" v-if="!!iconClass"></i>
      <slot name="title">{{ title }}</slot>
    </a>
    <div
      class="dropdown-menu"
      ref="menuRef"
      @mousedown.prevent.stop
      @click.prevent.stop="menuClick"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, watch, nextTick } from 'vue';

  export default defineComponent({
    name: 'Dropdown',
    props: {
      linkClass: {
        type: String,
        default: 'btn btn-secondary dropdown-toggle'
      },
      wrapClass: {
        type: String,
        default: 'dropdown'
      },
      iconClass: {
        type: String,
        required: false
      },
      keepOpen: {
        type: Boolean,
        required: false
      },
      title: {
        type: String,
        required: false
      },
      linkStyle: {
        type: String,
        default: 'width:100%;text-align:left;align-items:center'
      }
    },
    setup(props) {
      const isOpen = ref(false);
      const menuRef = ref<HTMLElement>();
      const buttonRef = ref<HTMLElement>();

      const positionMenu = async () => {
        await nextTick();
        const menu = menuRef.value;
        const button = buttonRef.value;

        if (!menu || !button) return;

        if (!isOpen.value) {
          menu.style.cssText = '';
          return;
        }

        menu.style.display = 'block';
        const offset = menu.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.minWidth = `${button.clientWidth}px`;
        menu.style.left =
          offset.right < window.innerWidth
            ? `${offset.left}px`
            : `${window.innerWidth - offset.width}px`;
        menu.style.top =
          offset.bottom < window.innerHeight
            ? `${offset.top}px`
            : `${offset.top - offset.height - button.offsetHeight}px`;
      };

      watch(isOpen, positionMenu);

      const blur = (event: FocusEvent) => {
        let elm = event.relatedTarget as HTMLElement | null;
        while (elm) {
          if (elm === menuRef.value) return;
          elm = elm.parentElement;
        }
        isOpen.value = false;
      };

      const menuClick = () => {
        if (!props.keepOpen) isOpen.value = false;
      };

      return {
        isOpen,
        menuRef,
        buttonRef,
        blur,
        menuClick
      };
    }
  });
</script>
