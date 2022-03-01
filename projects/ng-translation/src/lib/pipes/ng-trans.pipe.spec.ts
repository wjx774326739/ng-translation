import { TestBed } from '@angular/core/testing';
import { filter, switchMap, take } from 'rxjs/operators';
import { NG_TRANS_DEFAULT_LANG } from '../constants/ng-trans-default-lang.token';
import { NG_TRANS_LOADER } from '../constants/ng-trans-loader.token';
import { INgTransOptions } from '../models';
import { NgTransLangEnum } from '../models/ng-trans-lang.enum';
import { NgTransTestingModule } from '../ng-trans-testing.module';
import { NgTransService } from '../services/ng-trans.service';
import { translationSyncTestData, transLoader } from '../tests';
import { NgTransPipe } from './ng-trans.pipe';

describe('Pipe: NgTrans', () => {
  let pipe: NgTransPipe;
  let transService: NgTransService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgTransTestingModule],
      declarations: [],
      providers: [
        { provide: NG_TRANS_DEFAULT_LANG, useValue: NgTransLangEnum.ZH_CN, },
        { provide: NG_TRANS_LOADER, useValue: transLoader.dynamicLoader },
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    transService = TestBed.inject(NgTransService);
    pipe = new NgTransPipe(transService);
  });

  beforeEach(async () => {
    await transService.subscribeLoadDefaultOver().toPromise();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('#transform()', () => {
    translationSyncTestData.map((item, index) => {
      const expect = {
        resultZHCN: item.expect.result,
        resultEN: item.expect.result,
      };
      if (index + 1 === translationSyncTestData.length) {
        expect.resultEN = 'hello world';
        expect.resultZHCN = '你好，世界';
      }
      return {
        ...item,
        expect,
      };
    }).forEach(item => {
      it(item.title, (done) => {
        const verifyResult = (expectResult: string) => {
          const result = pipe.transform(item.test.key, item.test.options);
          expect(result).toEqual(expectResult);
        };
        verifyResult(item.expect.resultZHCN);

        transService.changeLang(NgTransLangEnum.EN).pipe(take(1)).subscribe(() => {
          verifyResult(item.expect.resultEN);
          done();
        });
      });
    });

  });

  it('#ngOnDestroy()', (done) => {
    transService.changeLang(NgTransLangEnum.EN).pipe(
      switchMap(() => {
        pipe.ngOnDestroy();
        spyOn(transService, 'translationAsync').and.callThrough();
        return transService.changeLang(NgTransLangEnum.ZH_CN)
      }),
      take(1),
    ).subscribe(() => {
      expect(transService.translationAsync).toHaveBeenCalledTimes(0);
      done();
    });
  });

  it('verify the trans text will be updated when options has been updated', () => {
    let options: INgTransOptions = { prefix: 'content' };
    const result1 = pipe.transform('helloWorld', options);
    expect(result1).toEqual('你好，世界');

    options = { prefix: undefined };
    const result2 = pipe.transform('helloWorld', options);
    expect(result2).toEqual('你好，世界!');
  });

  it('verify the trans text will be updated when key has been updated', () => {
    const result1 = pipe.transform('content.helloWorld');
    expect(result1).toEqual('你好，世界');

    const result2 = pipe.transform('helloWorld');
    expect(result2).toEqual('你好，世界!');
  });

});
