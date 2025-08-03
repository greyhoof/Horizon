<template>
  <Modal
    :action="l('user.memo.action')"
    buttonText="Save and Close"
    @close="onClose"
    @submit="save"
    dialog-class="w-100 modal-dialog-centered"
    iconClass="fas fa-note-sticky"
  >
    <div class="form-group">
      <textarea
        v-model="message"
        maxlength="1000"
        class="form-control"
      ></textarea>
    </div>
  </Modal>
</template>

<script lang="ts">
  import { Component, Prop, Watch } from '@f-list/vue-ts';
  import CustomDialog from '../../components/custom_dialog';
  import Modal from '../../components/Modal.vue';
  import { SimpleCharacter } from '../../interfaces';
  import * as Utils from '../utils';
  import l from './../../chat/localize';
  // import {methods} from './data_store';
  import { MemoManager } from '../../chat/character/memo';

  export interface Memo {
    id: number;
    memo: string;
    character: SimpleCharacter;
    created_at: number;
    updated_at: number;
  }

  @Component({
    components: { Modal }
  })
  export default class MemoDialog extends CustomDialog {
    @Prop({ required: true })
    readonly character!: { id: number; name: string };
    @Prop
    readonly memo?: Memo;
    message: string | null = null;
    l = l;
    editing: boolean = false;
    saving: boolean = false;

    get name(): string {
      return this.character.name;
    }

    show(): void {
      super.show();
      this.setMemo();
      this.editing = true;
    }

    @Watch('memo')
    setMemo(): void {
      if (this.memo !== undefined) this.message = this.memo.memo;
    }

    onClose(): void {
      this.editing = false;
    }

    async save(): Promise<void> {
      if (!this.editing) return;
      try {
        this.saving = true;

        if (this.message === '') {
          this.message = null;
        }

        const memoManager = new MemoManager(this.character.name);
        await memoManager.set(this.message);

        this.$emit('memo', memoManager.get());
        this.hide();
      } catch (e) {
        Utils.ajaxError(e, 'Unable to set memo.');
      }
      this.saving = false;
    }
  }
</script>
