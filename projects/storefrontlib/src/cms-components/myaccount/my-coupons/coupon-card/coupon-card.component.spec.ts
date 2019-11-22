import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CouponCardComponent } from './coupon-card.component';
import { I18nTestingModule, CustomerCoupon } from '@spartacus/core';
import { By } from '@angular/platform-browser';
import { ModalService } from '../../../../shared/components/modal/index';
import { Pipe, PipeTransform, Component, DebugElement } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { MyCouponsComponentService } from '../my-coupons.component.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

const mockCoupon: CustomerCoupon = {
  couponId: 'CustomerCoupon',
  description: 'CustomerCouponDescription',
  endDate: '2019-12-30T23:59:59+0000',
  name: 'CustomerCoupon:name',
  notificationOn: false,
  allProductsApplicable: false,
  startDate: '1970-01-01T00:00:00+0000',
  status: 'Effective',
};

const subLoading$ = new BehaviorSubject<boolean>(false);
const unsubLoading$ = new BehaviorSubject<boolean>(false);

@Pipe({
  name: 'cxUrl',
})
class MockUrlPipe implements PipeTransform {
  transform() {}
}

@Component({
  selector: 'cx-my-coupons',
  template: `
    <cx-coupon-card
      [coupon]="coupon"
      [couponSubscriptionLoading$]="couponSubscriptionLoading$"
      (notificationChanged)="notificationChange($event)"
    >
    </cx-coupon-card>
  `,
})
class MyCouponsComponent {
  eventObj: {
    couponId: string;
    notification: boolean;
  };
  coupon = mockCoupon;
  couponSubscriptionLoading$ = combineLatest([subLoading$, unsubLoading$]).pipe(
    map(([subscribing, unsubscribing]) => subscribing || unsubscribing)
  );

  notificationChange = jasmine
    .createSpy()
    .and.callFake(({ couponId, notification }) => {
      this.eventObj = { couponId, notification };
    });
}

describe('CouponCardComponent', () => {
  let component: MyCouponsComponent;
  let fixture: ComponentFixture<MyCouponsComponent>;
  let el: DebugElement;
  const modalService = jasmine.createSpyObj('ModalService', ['open']);
  const couponComponentService = jasmine.createSpyObj(
    'MyCouponsComponentService',
    ['launchSearchPage']
  );
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CouponCardComponent, MyCouponsComponent, MockUrlPipe],
      imports: [I18nTestingModule, RouterTestingModule],
      providers: [
        { provide: ModalService, useValue: modalService },
        {
          provide: MyCouponsComponentService,
          useValue: couponComponentService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyCouponsComponent);
    component = fixture.componentInstance;
    el = fixture.debugElement;
    modalService.open.and.stub();
    component.coupon.notificationOn = false;
    unsubLoading$.next(false);
    subLoading$.next(false);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(el.query(By.css('cx-coupon-card'))).toBeTruthy();
  });

  it('should display coupon information', () => {
    fixture.detectChanges();
    const id = el.queryAll(By.css('.cx-coupon-card-head span'))[0].nativeElement
      .textContent;
    expect(id).toContain(mockCoupon.couponId);

    const name = el.queryAll(By.css('.cx-coupon-card-head span'))[1]
      .nativeElement.textContent;
    expect(name).toContain(mockCoupon.name);

    const couponStatus = el.query(By.css('.cx-coupon-status')).nativeElement
      .textContent;
    expect(couponStatus).toContain(mockCoupon.status);

    const couponEffectiveDateTitle = el.query(By.css('.cx-coupon-card-date p'))
      .nativeElement.textContent;
    expect(couponEffectiveDateTitle).toContain('myCoupons.effectiveTitle');
    const couponStartDate = el.query(By.css('.cx-coupon-date-start'))
      .nativeElement.textContent;
    expect(couponStartDate).toBeTruthy();
    const couponEndDate = el.query(By.css('.cx-coupon-date-end')).nativeElement
      .textContent;
    expect(couponEndDate).toBeTruthy();

    const readMoreLink = el.query(By.css('a')).nativeElement.textContent;
    expect(readMoreLink).toContain('myCoupons.readMore');

    const couponNotificationCheckbox = el.queryAll(By.css('.form-check-input'));
    expect(couponNotificationCheckbox.length).toBe(1);
    const couponNotificationLabel = el.query(By.css('.form-check-label'))
      .nativeElement.textContent;
    expect(couponNotificationLabel).toContain('myCoupons.notification');

    const findProductBtn = el.query(By.css('button')).nativeElement.textContent;
    expect(findProductBtn).toContain('myCoupons.findProducts');
  });

  it('should be able to open coupon detail dialog', () => {
    fixture.detectChanges();
    const readMoreLink = el.query(By.css('a'));
    readMoreLink.nativeElement.click();
    expect(modalService.open).toHaveBeenCalled();
  });

  it('should be able to show correct status when subscribe notification', () => {
    fixture.detectChanges();
    const couponNotificationCheckbox = el.query(By.css('.form-check-input'));
    const checkbox = couponNotificationCheckbox.nativeElement;
    expect(checkbox.checked).toBeFalsy();

    subLoading$.next(true);
    couponNotificationCheckbox.triggerEventHandler('change', null);

    fixture.detectChanges();
    expect(component.notificationChange).toHaveBeenCalledWith({
      couponId: component.coupon.couponId,
      notification: true,
    });
    expect(checkbox.disabled).toEqual(true);
  });

  it('should be able to show correct status when unsubscribe notification', () => {
    component.coupon.notificationOn = true;
    fixture.detectChanges();
    const couponNotificationCheckbox = el.query(By.css('.form-check-input'));
    const checkbox = couponNotificationCheckbox.nativeElement;
    expect(checkbox.checked).toBeTruthy();

    unsubLoading$.next(true);
    couponNotificationCheckbox.triggerEventHandler('change', null);

    fixture.detectChanges();
    expect(component.notificationChange).toHaveBeenCalledWith({
      couponId: component.coupon.couponId,
      notification: false,
    });
    expect(checkbox.disabled).toEqual(true);
  });

  it('should be able to click `Find Product` button', () => {
    fixture.detectChanges();
    el.query(By.css('button')).triggerEventHandler('click', null);
    expect(couponComponentService.launchSearchPage).toHaveBeenCalledWith(
      component.coupon
    );
  });
});