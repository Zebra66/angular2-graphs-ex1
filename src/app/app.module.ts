import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { SimpleNotificationsModule } from 'angular2-notifications-lite';

import { AppComponent } from './app.component';
import { BinaryTreeComponent } from './binary-tree/binary-tree.component';
import { CircularGraphComponent } from './circular-graph/circular-graph.component';

@NgModule({
  declarations: [
    AppComponent,
    BinaryTreeComponent,
    CircularGraphComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    SimpleNotificationsModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
