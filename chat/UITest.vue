<template>
  <modal
    action="UI Test"
    ref="dialog"
    dialogClass="w-100 modal-70"
    iconClass="fas fa-user-slash"
    :buttons="false"
  >
    <div>
      <button class="btn btn-primary">Primary</button>

      <button class="btn btn-secondary">Secondary</button>

      <button class="btn btn-warning">Warning</button>
      <button class="btn btn-danger">Danger</button>
      <button class="btn btn-success">Success</button>
    </div>

    <div>
      <button class="btn btn-outline-primary">Primary</button>

      <button class="btn btn-outline-secondary">Secondary</button>

      <button class="btn btn-outline-warning">Warning</button>
      <button class="btn btn-outline-danger">Danger</button>
      <button class="btn btn-outline-success">Success</button>
    </div>
  </modal>
</template>

<script lang="ts">
  import { Component } from '@f-list/vue-ts';
  import CustomDialog from '../components/custom_dialog';
  import Modal from '../components/Modal.vue';

  @Component({
    components: { modal: Modal }
  })
  export default class UITest extends CustomDialog {}
</script>
